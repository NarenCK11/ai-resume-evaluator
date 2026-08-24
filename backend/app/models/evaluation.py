import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Recommendation(str, enum.Enum):
    STRONG_MATCH = "Strong Match"
    GOOD_MATCH = "Good Match"
    WEAK_MATCH = "Weak Match"
    NOT_A_MATCH = "Not a Match"


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), nullable=False)

    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    recommendation: Mapped[Recommendation] = mapped_column(Enum(Recommendation), nullable=False)

    score_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)

    matched_required_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    missing_required_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    matched_preferred_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    missing_preferred_skills: Mapped[list[str]] = mapped_column(JSON, default=list)

    strengths: Mapped[list[str]] = mapped_column(JSON, default=list)
    concerns: Mapped[list[str]] = mapped_column(JSON, default=list)
    summary: Mapped[str] = mapped_column(Text, default="")

    raw_evidence: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    candidate: Mapped["Candidate"] = relationship(back_populates="evaluations")
