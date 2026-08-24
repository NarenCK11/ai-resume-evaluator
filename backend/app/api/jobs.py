from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate, EvaluationStatus
from app.models.evaluation import Evaluation
from app.models.job import JobOpening
from app.models.user import User
from app.schemas.job import JobOpeningCreate, JobOpeningOut, JobOpeningUpdate, JobOpeningWithStats

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _get_owned_job(db: Session, job_id: int, user: User) -> JobOpening:
    job = db.query(JobOpening).filter(JobOpening.id == job_id).first()
    if not job or job.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Job opening not found")
    return job


def _with_stats(db: Session, job: JobOpening) -> JobOpeningWithStats:
    candidates = db.query(Candidate).filter(Candidate.job_opening_id == job.id).all()
    candidate_ids = [c.id for c in candidates]
    evaluated_count = sum(1 for c in candidates if c.evaluation_status == EvaluationStatus.EVALUATED)

    scores: list[float] = []
    if candidate_ids:
        latest_scores = (
            db.query(Evaluation.candidate_id, func.max(Evaluation.created_at))
            .filter(Evaluation.candidate_id.in_(candidate_ids))
            .group_by(Evaluation.candidate_id)
            .all()
        )
        for cand_id, _ in latest_scores:
            latest_eval = (
                db.query(Evaluation)
                .filter(Evaluation.candidate_id == cand_id)
                .order_by(Evaluation.created_at.desc())
                .first()
            )
            if latest_eval:
                scores.append(latest_eval.overall_score)

    data = JobOpeningOut.model_validate(job).model_dump()
    return JobOpeningWithStats(
        **data,
        candidate_count=len(candidates),
        evaluated_count=evaluated_count,
        top_score=max(scores) if scores else None,
        average_score=round(sum(scores) / len(scores), 1) if scores else None,
    )


@router.post("", response_model=JobOpeningOut, status_code=201)
def create_job(
    payload: JobOpeningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = JobOpening(owner_id=current_user.id, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobOpeningWithStats])
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = (
        db.query(JobOpening)
        .filter(JobOpening.owner_id == current_user.id)
        .order_by(JobOpening.created_at.desc())
        .all()
    )
    return [_with_stats(db, job) for job in jobs]


@router.get("/{job_id}", response_model=JobOpeningWithStats)
def get_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = _get_owned_job(db, job_id, current_user)
    return _with_stats(db, job)


@router.patch("/{job_id}", response_model=JobOpeningOut)
def update_job(
    job_id: int,
    payload: JobOpeningUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_owned_job(db, job_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = _get_owned_job(db, job_id, current_user)
    db.delete(job)
    db.commit()
