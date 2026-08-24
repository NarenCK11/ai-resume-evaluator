from abc import ABC, abstractmethod

from app.models.job import JobOpening
from app.services.llm.schemas import EvaluationEvidence


class LLMProvider(ABC):
    """Clean abstraction so the rest of the app never depends on a specific
    LLM vendor. Swap providers via LLM_PROVIDER without touching callers."""

    @abstractmethod
    def evaluate_resume(self, resume_text: str, job: JobOpening) -> EvaluationEvidence:
        """Analyze a resume against a job opening and return structured evidence."""
        raise NotImplementedError
