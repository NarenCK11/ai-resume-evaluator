from functools import lru_cache

from app.core.config import settings
from app.services.llm.base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER.lower().strip()

    if provider == "anthropic":
        from app.services.llm.anthropic_provider import AnthropicLLMProvider

        return AnthropicLLMProvider()

    from app.services.llm.mock import MockLLMProvider

    return MockLLMProvider()
