from app.models.candidate import Candidate, EvaluationStatus
from app.models.evaluation import Evaluation, Recommendation
from app.models.job import EducationLevel, JobOpening, JobStatus
from app.models.user import User

__all__ = [
    "User",
    "JobOpening",
    "EducationLevel",
    "JobStatus",
    "Candidate",
    "EvaluationStatus",
    "Evaluation",
    "Recommendation",
]
