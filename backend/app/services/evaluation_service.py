from sqlalchemy.orm import Session

from app.models.candidate import Candidate, EvaluationStatus
from app.models.evaluation import Evaluation
from app.models.job import JobOpening
from app.services import scoring
from app.services.llm.factory import get_llm_provider


def run_evaluation(db: Session, candidate: Candidate, job: JobOpening) -> Evaluation:
    """Runs the full pipeline for one candidate: LLM evidence -> deterministic
    scoring -> persisted Evaluation row. Raises on failure; caller decides how
    to record the failure state."""

    candidate.evaluation_status = EvaluationStatus.EVALUATING
    candidate.evaluation_error = ""
    db.commit()

    try:
        provider = get_llm_provider()
        evidence = provider.evaluate_resume(candidate.resume_text or "", job)

        (
            overall_score,
            breakdown,
            recommendation,
            matched_required,
            missing_required,
            matched_preferred,
            missing_preferred,
        ) = scoring.calculate_score(job, evidence)

        evaluation = Evaluation(
            candidate_id=candidate.id,
            overall_score=overall_score,
            recommendation=recommendation,
            score_breakdown=breakdown,
            matched_required_skills=matched_required,
            missing_required_skills=missing_required,
            matched_preferred_skills=matched_preferred,
            missing_preferred_skills=missing_preferred,
            strengths=evidence.strengths,
            concerns=evidence.concerns,
            summary=evidence.summary,
            raw_evidence=evidence.model_dump(mode="json"),
        )
        db.add(evaluation)
        candidate.evaluation_status = EvaluationStatus.EVALUATED
        db.commit()
        db.refresh(evaluation)
        return evaluation
    except Exception as exc:
        candidate.evaluation_status = EvaluationStatus.FAILED
        candidate.evaluation_error = str(exc)[:1000]
        db.commit()
        raise
