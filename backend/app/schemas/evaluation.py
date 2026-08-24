from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.evaluation import Recommendation


class ScoreBreakdown(BaseModel):
    required_skills: float
    preferred_skills: float
    experience: float
    education: float
    job_description_fit: float
    projects_certifications: float


class EvaluationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    overall_score: float
    recommendation: Recommendation
    score_breakdown: dict
    matched_required_skills: list[str]
    missing_required_skills: list[str]
    matched_preferred_skills: list[str]
    missing_preferred_skills: list[str]
    strengths: list[str]
    concerns: list[str]
    summary: str
    raw_evidence: dict
    created_at: datetime
