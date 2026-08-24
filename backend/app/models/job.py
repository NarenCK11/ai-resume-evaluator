import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EducationLevel(str, enum.Enum):
    NONE = "none"
    HIGH_SCHOOL = "high_school"
    ASSOCIATE = "associate"
    BACHELOR = "bachelor"
    MASTER = "master"
    DOCTORATE = "doctorate"


class JobStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"


class JobOpening(Base):
    __tablename__ = "job_openings"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    required_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    preferred_skills: Mapped[list[str]] = mapped_column(JSON, default=list)

    min_experience_years: Mapped[float] = mapped_column(default=0)
    max_experience_years: Mapped[float | None] = mapped_column(nullable=True)

    education_requirement: Mapped[EducationLevel] = mapped_column(
        Enum(EducationLevel), default=EducationLevel.NONE
    )

    location: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    employment_type: Mapped[str] = mapped_column(String(100), nullable=True, default="Full-time")
    other_details: Mapped[str] = mapped_column(Text, nullable=True, default="")

    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.OPEN)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner: Mapped["User"] = relationship(back_populates="job_openings")
    candidates: Mapped[list["Candidate"]] = relationship(
        back_populates="job_opening", cascade="all, delete-orphan"
    )
