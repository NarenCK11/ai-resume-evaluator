import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.candidate import Candidate, EvaluationStatus
from app.models.job import JobOpening
from app.models.user import User
from app.schemas.candidate import CandidateOut, CandidateWithEvaluation, RankedCandidate
from app.schemas.evaluation import EvaluationOut
from app.services.evaluation_service import run_evaluation
from app.services.resume_parser import ResumeParsingError, extract_text

router = APIRouter(tags=["candidates"])


def _get_owned_job(db: Session, job_id: int, user: User) -> JobOpening:
    job = db.query(JobOpening).filter(JobOpening.id == job_id).first()
    if not job or job.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Job opening not found")
    return job


def _get_owned_candidate(db: Session, candidate_id: int, user: User) -> Candidate:
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = db.query(JobOpening).filter(JobOpening.id == candidate.job_opening_id).first()
    if not job or job.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


def _to_ranked_list(candidates: list[Candidate]) -> list[RankedCandidate]:
    scored, unscored = [], []
    for c in candidates:
        latest = c.evaluations[0] if c.evaluations else None
        if latest:
            scored.append((c, latest))
        else:
            unscored.append(c)

    scored.sort(key=lambda pair: pair[1].overall_score, reverse=True)

    ranked: list[RankedCandidate] = []
    for idx, (c, latest) in enumerate(scored, start=1):
        base = CandidateOut.model_validate(c).model_dump()
        ranked.append(
            RankedCandidate(
                **base, rank=idx, overall_score=latest.overall_score, recommendation=latest.recommendation.value
            )
        )
    for c in unscored:
        base = CandidateOut.model_validate(c).model_dump()
        ranked.append(RankedCandidate(**base, rank=0, overall_score=None, recommendation=None))

    return ranked


@router.get("/api/jobs/{job_id}/candidates", response_model=list[RankedCandidate])
def list_candidates(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = _get_owned_job(db, job_id, current_user)
    candidates = (
        db.query(Candidate)
        .filter(Candidate.job_opening_id == job.id)
        .order_by(Candidate.created_at.asc())
        .all()
    )
    return _to_ranked_list(candidates)


@router.post("/api/jobs/{job_id}/candidates", response_model=CandidateWithEvaluation, status_code=201)
async def add_candidate(
    job_id: int,
    full_name: str = Form(...),
    email: str = Form(""),
    phone: str = Form(""),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_owned_job(db, job_id, current_user)

    if not full_name.strip():
        raise HTTPException(status_code=422, detail="Candidate name is required")

    file_bytes = await resume.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Resume exceeds {settings.MAX_UPLOAD_MB}MB limit")

    try:
        resume_text = extract_text(file_bytes, resume.filename or "resume")
    except ResumeParsingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    upload_dir = Path(settings.UPLOAD_DIR) / str(job.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(resume.filename or "resume").suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = upload_dir / stored_name
    stored_path.write_bytes(file_bytes)

    candidate = Candidate(
        job_opening_id=job.id,
        full_name=full_name.strip(),
        email=email.strip(),
        phone=phone.strip(),
        resume_filename=resume.filename or stored_name,
        resume_path=str(stored_path),
        resume_text=resume_text,
        evaluation_status=EvaluationStatus.PENDING,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    latest_evaluation = None
    try:
        latest_evaluation = run_evaluation(db, candidate, job)
    except Exception:
        pass  # candidate is still created; status/error recorded on the row

    db.refresh(candidate)
    result = CandidateOut.model_validate(candidate).model_dump()
    return CandidateWithEvaluation(
        **result,
        latest_evaluation=EvaluationOut.model_validate(latest_evaluation) if latest_evaluation else None,
    )


@router.get("/api/candidates/{candidate_id}", response_model=CandidateWithEvaluation)
def get_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    candidate = _get_owned_candidate(db, candidate_id, current_user)
    latest = candidate.evaluations[0] if candidate.evaluations else None
    result = CandidateOut.model_validate(candidate).model_dump()
    return CandidateWithEvaluation(
        **result, latest_evaluation=EvaluationOut.model_validate(latest) if latest else None
    )


@router.post("/api/candidates/{candidate_id}/reevaluate", response_model=CandidateWithEvaluation)
def reevaluate_candidate(
    candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = _get_owned_candidate(db, candidate_id, current_user)
    job = db.query(JobOpening).filter(JobOpening.id == candidate.job_opening_id).first()

    try:
        latest_evaluation = run_evaluation(db, candidate, job)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Evaluation failed: {exc}") from exc

    db.refresh(candidate)
    result = CandidateOut.model_validate(candidate).model_dump()
    return CandidateWithEvaluation(
        **result, latest_evaluation=EvaluationOut.model_validate(latest_evaluation)
    )


@router.delete("/api/candidates/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    candidate = _get_owned_candidate(db, candidate_id, current_user)
    if candidate.resume_path:
        try:
            Path(candidate.resume_path).unlink(missing_ok=True)
        except OSError:
            pass
    db.delete(candidate)
    db.commit()
