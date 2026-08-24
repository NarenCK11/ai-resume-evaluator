from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.candidate import EvaluationStatus
from app.schemas.evaluation import EvaluationOut


class CandidateCreate(BaseModel):
    full_name: str
    email: str = ""
    phone: str = ""


class CandidateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_opening_id: int
    full_name: str
    email: str
    phone: str
    resume_filename: str
    evaluation_status: EvaluationStatus
    evaluation_error: str
    created_at: datetime


class CandidateWithEvaluation(CandidateOut):
    latest_evaluation: EvaluationOut | None = None


class RankedCandidate(CandidateOut):
    rank: int
    overall_score: float | None = None
    recommendation: str | None = None
