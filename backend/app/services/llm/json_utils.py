"""Shared helper for LLM providers that ask a model to return raw JSON text."""
import json
import re


def parse_json_object(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"LLM did not return valid JSON: {raw_text[:500]}")
