"""Real LLM-backed evaluation provider using the Groq API (OpenAI-compatible
chat completions, served over Groq's LPU inference -- free tier friendly).

The model is instructed to return structured JSON evidence only -- never a
final score. `app.services.scoring` computes the actual /100 score.
"""
from __future__ import annotations

from groq import Groq

from app.core.config import settings
from app.models.job import JobOpening
from app.services.llm.base import LLMProvider
from app.services.llm.json_utils import parse_json_object
from app.services.llm.prompts import SYSTEM_PROMPT, build_user_message
from app.services.llm.schemas import EvaluationEvidence


class GroqLLMProvider(LLMProvider):
    def __init__(self) -> None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Set LLM_PROVIDER=mock or provide an API key."
            )
        self._client = Groq(api_key=settings.GROQ_API_KEY)
        self._model = settings.GROQ_MODEL

    def evaluate_resume(self, resume_text: str, job: JobOpening) -> EvaluationEvidence:
        user_message = build_user_message(resume_text, job)

        response = self._client.chat.completions.create(
            model=self._model,
            max_tokens=2000,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )

        raw_text = (response.choices[0].message.content or "").strip()
        data = parse_json_object(raw_text)
        return EvaluationEvidence.model_validate(data)
