"""The structured evidence contract every LLM provider must return.

Providers never return a final /100 score. They return structured findings
(evidence) about the resume vs the job. `app.services.scoring` turns this
evidence into the deterministic final score, so no provider can arbitrarily
decide "this candidate is an 87".
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.job import EducationLevel


class EvaluationEvidence(BaseModel):
    matched_required_skills: list[str] = Field(default_factory=list)
    matched_preferred_skills: list[str] = Field(default_factory=list)

    experience_years_estimated: float = 0
    experience_relevance_score: float = 0  # 0-100, how relevant the experience is to this role
    experience_notes: str = ""

    candidate_education_level: EducationLevel = EducationLevel.NONE
    education_notes: str = ""

    job_description_fit_score: float = 0  # 0-100, holistic semantic alignment to the JD
    job_description_fit_notes: str = ""

    relevant_projects_certifications: list[str] = Field(default_factory=list)
    projects_certifications_score: float = 0  # 0-100

    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    summary: str = ""
