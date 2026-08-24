from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.job import EducationLevel, JobStatus


class JobOpeningBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    department: str = ""
    description: str = ""
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    min_experience_years: float = 0
    max_experience_years: float | None = None
    education_requirement: EducationLevel = EducationLevel.NONE
    location: str = ""
    employment_type: str = "Full-time"
    other_details: str = ""


class JobOpeningCreate(JobOpeningBase):
    pass


class JobOpeningUpdate(BaseModel):
    title: str | None = None
    department: str | None = None
    description: str | None = None
    required_skills: list[str] | None = None
    preferred_skills: list[str] | None = None
    min_experience_years: float | None = None
    max_experience_years: float | None = None
    education_requirement: EducationLevel | None = None
    location: str | None = None
    employment_type: str | None = None
    other_details: str | None = None
    status: JobStatus | None = None


class JobOpeningOut(JobOpeningBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    status: JobStatus
    created_at: datetime
    updated_at: datetime


class JobOpeningWithStats(JobOpeningOut):
    candidate_count: int = 0
    evaluated_count: int = 0
    top_score: float | None = None
    average_score: float | None = None
