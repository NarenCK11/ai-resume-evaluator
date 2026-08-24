from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.candidates import _get_owned_candidate
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.evaluation import Evaluation
from app.models.user import User
from app.schemas.evaluation import EvaluationOut

router = APIRouter(prefix="/api", tags=["evaluations"])


@router.get("/candidates/{candidate_id}/evaluations", response_model=list[EvaluationOut])
def list_evaluations(candidate_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    candidate = _get_owned_candidate(db, candidate_id, current_user)
    return (
        db.query(Evaluation)
        .filter(Evaluation.candidate_id == candidate.id)
        .order_by(Evaluation.created_at.desc())
        .all()
    )


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationOut)
def get_evaluation(evaluation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    _get_owned_candidate(db, evaluation.candidate_id, current_user)
    return evaluation
