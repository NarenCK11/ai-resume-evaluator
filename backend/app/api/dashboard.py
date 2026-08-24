from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate, EvaluationStatus
from app.models.evaluation import Evaluation, Recommendation
from app.models.job import JobOpening, JobStatus
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    jobs = db.query(JobOpening).filter(JobOpening.owner_id == current_user.id).all()
    job_ids = [j.id for j in jobs]

    candidates = (
        db.query(Candidate).filter(Candidate.job_opening_id.in_(job_ids)).all() if job_ids else []
    )
    candidate_ids = [c.id for c in candidates]

    latest_scores: list[float] = []
    strong_matches = 0
    if candidate_ids:
        for cand_id in candidate_ids:
            latest = (
                db.query(Evaluation)
                .filter(Evaluation.candidate_id == cand_id)
                .order_by(Evaluation.created_at.desc())
                .first()
            )
            if latest:
                latest_scores.append(latest.overall_score)
                if latest.recommendation == Recommendation.STRONG_MATCH:
                    strong_matches += 1

    recent_candidates = sorted(candidates, key=lambda c: c.created_at, reverse=True)[:5]
    recent_out = []
    for c in recent_candidates:
        latest = c.evaluations[0] if c.evaluations else None
        job = next((j for j in jobs if j.id == c.job_opening_id), None)
        recent_out.append(
            {
                "id": c.id,
                "full_name": c.full_name,
                "job_title": job.title if job else "",
                "job_id": c.job_opening_id,
                "score": latest.overall_score if latest else None,
                "recommendation": latest.recommendation.value if latest else None,
                "evaluation_status": c.evaluation_status.value,
                "created_at": c.created_at.isoformat(),
            }
        )

    return {
        "total_job_openings": len(jobs),
        "open_job_openings": sum(1 for j in jobs if j.status == JobStatus.OPEN),
        "total_candidates": len(candidates),
        "evaluated_candidates": sum(
            1 for c in candidates if c.evaluation_status == EvaluationStatus.EVALUATED
        ),
        "pending_candidates": sum(
            1 for c in candidates if c.evaluation_status in (EvaluationStatus.PENDING, EvaluationStatus.EVALUATING)
        ),
        "failed_candidates": sum(
            1 for c in candidates if c.evaluation_status == EvaluationStatus.FAILED
        ),
        "average_score": round(sum(latest_scores) / len(latest_scores), 1) if latest_scores else None,
        "strong_matches": strong_matches,
        "recent_candidates": recent_out,
    }
