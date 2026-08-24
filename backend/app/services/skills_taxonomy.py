"""Lightweight skill-synonym taxonomy so matching isn't purely exact-string.

This backs the mock LLM provider (which has no real language understanding)
and acts as a normalization helper elsewhere. The real LLM provider does its
own semantic reasoning about related skill names and only uses this module
indirectly (via prompt instructions).
"""
from __future__ import annotations

import difflib
import re

# Maps common aliases -> canonical skill name.
_SYNONYMS: dict[str, str] = {
    "js": "javascript",
    "ecmascript": "javascript",
    "ts": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "vuejs": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "nodejs": "node.js",
    "node": "node.js",
    "expressjs": "express",
    "nextjs": "next.js",
    "next": "next.js",
    "py": "python",
    "golang": "go",
    "postgres": "postgresql",
    "psql": "postgresql",
    "mongo": "mongodb",
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "azure cloud": "azure",
    "ml": "machine learning",
    "dl": "deep learning",
    "ai": "artificial intelligence",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    "oop": "object oriented programming",
    "rest api": "rest",
    "restful": "rest",
    "graphql api": "graphql",
    "html5": "html",
    "css3": "css",
    "scss": "sass",
    "tf": "terraform",
    "gh actions": "github actions",
    "pytorch lightning": "pytorch",
    "sklearn": "scikit-learn",
    "power bi": "powerbi",
    "ms excel": "excel",
    "msexcel": "excel",
    "spoken english": "english",
    "written english": "english",
    "team lead": "leadership",
    "team leadership": "leadership",
    "project management": "pm",
    "product management": "pm",
}

_STOPCHARS = re.compile(r"[^a-z0-9+.# ]")


def normalize(skill: str) -> str:
    """Lowercase, strip punctuation noise, and resolve known synonyms."""
    cleaned = _STOPCHARS.sub(" ", skill.lower()).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return _SYNONYMS.get(cleaned, cleaned)


def _phrase_in(needle: str, haystack: str) -> bool:
    """Token-boundary-safe containment check (avoids e.g. "go" matching inside
    "google" or "ai" matching inside "email" the way raw substring checks would)."""
    if not needle or not haystack:
        return False
    return f" {haystack} ".find(f" {needle} ") != -1


def is_related(skill_a: str, skill_b: str, threshold: float = 0.82) -> bool:
    """True if two skill strings likely refer to the same thing.

    Combines exact match after normalization, token-boundary containment, and
    a fuzzy ratio fallback so near-miss spellings/abbreviations still count.
    """
    a, b = normalize(skill_a), normalize(skill_b)
    if not a or not b:
        return False
    if a == b:
        return True
    if _phrase_in(a, b) or _phrase_in(b, a):
        return True
    return difflib.SequenceMatcher(None, a, b).ratio() >= threshold


def find_match(skill: str, text: str) -> bool:
    """Heuristic check for whether `skill` (or a synonym/variant) appears in `text`."""
    normalized_skill = normalize(skill)
    normalized_text = _STOPCHARS.sub(" ", text.lower())
    normalized_text = re.sub(r"\s+", " ", normalized_text)

    if _phrase_in(normalized_skill, normalized_text):
        return True

    # Check reverse synonym lookups (canonical -> alias appearing in text).
    aliases = [alias for alias, canon in _SYNONYMS.items() if canon == normalized_skill]
    for alias in aliases:
        if _phrase_in(alias, normalized_text):
            return True

    # Fuzzy fallback against individual tokens/phrases of similar length.
    words = normalized_text.split()
    skill_word_count = max(1, len(normalized_skill.split()))
    for i in range(len(words) - skill_word_count + 1):
        window = " ".join(words[i : i + skill_word_count])
        if difflib.SequenceMatcher(None, normalized_skill, window).ratio() >= 0.88:
            return True

    return False
