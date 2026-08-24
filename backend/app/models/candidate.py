import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EvaluationStatus(str, enum.Enum):
    PENDING = "pending"
    EVALUATING = "evaluating"
    EVALUATED = "evaluated"
    FAILED = "failed"


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_opening_id: Mapped[int] = mapped_column(ForeignKey("job_openings.id"), nullable=False)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True, default="")
    phone: Mapped[str] = mapped_column(String(50), nullable=True, default="")

    resume_filename: Mapped[str] = mapped_column(String(500), nullable=True, default="")
    resume_path: Mapped[str] = mapped_column(String(1000), nullable=True, default="")
    resume_text: Mapped[str] = mapped_column(Text, nullable=True, default="")

    evaluation_status: Mapped[EvaluationStatus] = mapped_column(
        Enum(EvaluationStatus), default=EvaluationStatus.PENDING
    )
    evaluation_error: Mapped[str] = mapped_column(Text, nullable=True, default="")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    job_opening: Mapped["JobOpening"] = relationship(back_populates="candidates")
    evaluations: Mapped[list["Evaluation"]] = relationship(
        back_populates="candidate", cascade="all, delete-orphan", order_by="Evaluation.created_at.desc()"
    )
