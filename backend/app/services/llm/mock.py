"""Deterministic, dependency-free evaluation provider.

Used automatically when LLM_PROVIDER=mock (the default) or when no API key
is configured, so the whole app works out of the box without any external
service. It applies the same synonym-aware skill matching, plus simple
regex/keyword heuristics for experience, education, and certifications.
"""
from __future__ import annotations

import re
from datetime import datetime

from app.models.job import EducationLevel, JobOpening
from app.services import skills_taxonomy
from app.services.llm.base import LLMProvider
from app.services.llm.schemas import EvaluationEvidence

_EDUCATION_KEYWORDS: list[tuple[EducationLevel, list[str]]] = [
    (EducationLevel.DOCTORATE, ["phd", "ph.d", "doctorate", "doctoral"]),
    (EducationLevel.MASTER, ["master of", "m.s.", "msc", "m.tech", "mba", "master's"]),
    (EducationLevel.BACHELOR, [
        "bachelor", "b.s.", "bsc", "b.tech", "b.e.", "undergraduate degree", "bachelor's",
    ]),
    (EducationLevel.ASSOCIATE, ["associate degree", "associate's"]),
    (EducationLevel.HIGH_SCHOOL, ["high school", "secondary school", "diploma"]),
]

_YEARS_PATTERNS = [
    re.compile(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+of\s+experience", re.I),
    re.compile(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s+experience", re.I),
    re.compile(r"experience[:\s]+(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)", re.I),
]

_CERT_KEYWORDS = ["certified", "certificate", "certification", "certifications"]
_PROJECT_KEYWORDS = ["project:", "projects\n", "key project", "personal project"]


class MockLLMProvider(LLMProvider):
    def evaluate_resume(self, resume_text: str, job: JobOpening) -> EvaluationEvidence:
        text = resume_text or ""

        matched_required = self._match_skills(job.required_skills, text)
        matched_preferred = self._match_skills(job.preferred_skills, text)

        years = self._estimate_years(text)
        education_level = self._detect_education(text)

        required_ratio = (
            len(matched_required) / len(job.required_skills) if job.required_skills else 1.0
        )
        preferred_ratio = (
            len(matched_preferred) / len(job.preferred_skills) if job.preferred_skills else 1.0
        )
        experience_relevance = min(100.0, round(required_ratio * 60 + preferred_ratio * 20 + 20, 1))

        jd_fit = round((required_ratio * 0.6 + preferred_ratio * 0.4) * 100, 1)

        cert_hits = sum(1 for kw in _CERT_KEYWORDS if kw in text.lower())
        project_hits = sum(1 for kw in _PROJECT_KEYWORDS if kw in text.lower())
        projects_score = min(100.0, cert_hits * 25 + project_hits * 20 + 20)
        relevant_items = []
        if cert_hits:
            relevant_items.append("Certifications mentioned in resume")
        if project_hits:
            relevant_items.append("Relevant projects mentioned in resume")

        strengths = []
        if matched_required:
            strengths.append(
                f"Matches {len(matched_required)}/{len(job.required_skills)} required skills"
                if job.required_skills
                else "Matches required skill set"
            )
        if years >= job.min_experience_years and job.min_experience_years > 0:
            strengths.append(f"Meets minimum experience requirement (~{years:g} years found)")
        if not strengths:
            strengths.append("Resume submitted and parsed successfully")

        concerns = []
        missing_required = [s for s in job.required_skills if s not in matched_required]
        if missing_required:
            concerns.append(f"Missing {len(missing_required)} required skill(s): " + ", ".join(missing_required[:5]))
        if job.min_experience_years and years < job.min_experience_years:
            concerns.append(
                f"Estimated experience (~{years:g} yrs) is below the required {job.min_experience_years:g} yrs"
            )
        if not concerns:
            concerns.append("No major concerns detected by automated screening")

        summary = (
            f"Automated (mock) screening found {len(matched_required)} of "
            f"{len(job.required_skills)} required skills and {len(matched_preferred)} of "
            f"{len(job.preferred_skills)} preferred skills, with an estimated {years:g} years "
            f"of experience and a highest detected education level of "
            f"{education_level.value.replace('_', ' ')}."
        )

        return EvaluationEvidence(
            matched_required_skills=matched_required,
            matched_preferred_skills=matched_preferred,
            experience_years_estimated=years,
            experience_relevance_score=experience_relevance,
            experience_notes=f"Detected approximately {years:g} years of experience from resume text.",
            candidate_education_level=education_level,
            education_notes=f"Highest education level detected: {education_level.value.replace('_', ' ')}.",
            job_description_fit_score=jd_fit,
            job_description_fit_notes="Estimated from required/preferred skill coverage (mock provider).",
            relevant_projects_certifications=relevant_items,
            projects_certifications_score=projects_score,
            strengths=strengths,
            concerns=concerns,
            summary=summary,
        )

    @staticmethod
    def _match_skills(skills: list[str], text: str) -> list[str]:
        return [skill for skill in skills if skills_taxonomy.find_match(skill, text)]

    @staticmethod
    def _estimate_years(text: str) -> float:
        for pattern in _YEARS_PATTERNS:
            match = pattern.search(text)
            if match:
                return float(match.group(1))

        # Fall back to summing distinct date ranges (e.g. work history entries).
        total_years = 0.0
        current_year = datetime.now().year
        ranges = re.findall(r"(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(20\d{2}|19\d{2}|present|current)", text, re.I)
        for start_str, end_str in ranges:
            start_year = int(start_str)
            end_year = current_year if end_str.lower() in ("present", "current") else int(end_str)
            if end_year >= start_year:
                total_years += end_year - start_year
        return round(min(total_years, 40.0), 1)

    @staticmethod
    def _detect_education(text: str) -> EducationLevel:
        lowered = text.lower()
        for level, keywords in _EDUCATION_KEYWORDS:
            for kw in keywords:
                # Custom boundary (not \b) so punctuation-heavy abbreviations like
                # "m.s." or "mba" don't false-positive-match inside longer words
                # such as "Bombay".
                pattern = r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z0-9])"
                if re.search(pattern, lowered):
                    return level
        return EducationLevel.NONE
