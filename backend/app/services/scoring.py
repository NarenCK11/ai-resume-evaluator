"""Deterministic scoring: turns LLM-produced evidence into a final /100 score.

This is intentionally the ONLY place a final score is computed. LLM providers
supply structured evidence (matched skills, an experience-relevance rating,
etc.) but never the final number -- that keeps the score explainable,
reproducible, and immune to an LLM simply "deciding" a candidate is an 87.
"""
from __future__ import annotations

from app.models.job import EducationLevel, JobOpening
from app.models.evaluation import Recommendation
from app.services import skills_taxonomy
from app.services.llm.schemas import EvaluationEvidence

WEIGHTS = {
    "required_skills": 0.35,
    "preferred_skills": 0.10,
    "experience": 0.25,
    "education": 0.10,
    "job_description_fit": 0.10,
    "projects_certifications": 0.10,
}

_EDUCATION_ORDER = {
    EducationLevel.NONE: 0,
    EducationLevel.HIGH_SCHOOL: 1,
    EducationLevel.ASSOCIATE: 2,
    EducationLevel.BACHELOR: 3,
    EducationLevel.MASTER: 4,
    EducationLevel.DOCTORATE: 5,
}


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def reconcile_skills(
    required: list[str], preferred: list[str], evidence: EvaluationEvidence
) -> tuple[list[str], list[str], list[str], list[str]]:
    """Derive missing-skill lists deterministically instead of trusting the
    LLM to enumerate them, and validate matched skills actually belong to the
    job's lists (guards against hallucinated/extra skills)."""

    def _validated_matches(job_skills: list[str], claimed_matches: list[str]) -> list[str]:
        validated = []
        for job_skill in job_skills:
            if any(skills_taxonomy.is_related(job_skill, claim) for claim in claimed_matches):
                validated.append(job_skill)
        return validated

    matched_required = _validated_matches(required, evidence.matched_required_skills)
    matched_preferred = _validated_matches(preferred, evidence.matched_preferred_skills)
    missing_required = [s for s in required if s not in matched_required]
    missing_preferred = [s for s in preferred if s not in matched_preferred]

    return matched_required, missing_required, matched_preferred, missing_preferred


def calculate_score(
    job: JobOpening, evidence: EvaluationEvidence
) -> tuple[float, dict, Recommendation, list[str], list[str], list[str], list[str]]:
    matched_required, missing_required, matched_preferred, missing_preferred = reconcile_skills(
        job.required_skills, job.preferred_skills, evidence
    )

    required_score = (
        100.0
        if not job.required_skills
        else _clamp(len(matched_required) / len(job.required_skills) * 100)
    )
    preferred_score = (
        100.0
        if not job.preferred_skills
        else _clamp(len(matched_preferred) / len(job.preferred_skills) * 100)
    )

    if job.min_experience_years and job.min_experience_years > 0:
        years_ratio_score = _clamp(
            evidence.experience_years_estimated / job.min_experience_years * 100
        )
    else:
        years_ratio_score = 100.0
    experience_score = _clamp(
        0.5 * years_ratio_score + 0.5 * _clamp(evidence.experience_relevance_score)
    )

    if job.education_requirement == EducationLevel.NONE:
        education_score = 100.0
    else:
        required_level = _EDUCATION_ORDER[job.education_requirement]
        candidate_level = _EDUCATION_ORDER.get(evidence.candidate_education_level, 0)
        if candidate_level >= required_level:
            education_score = 100.0
        else:
            gap = required_level - candidate_level
            education_score = _clamp(100 - gap * 30)

    jd_fit_score = _clamp(evidence.job_description_fit_score)
    projects_score = _clamp(evidence.projects_certifications_score)

    components = {
        "required_skills": required_score,
        "preferred_skills": preferred_score,
        "experience": experience_score,
        "education": education_score,
        "job_description_fit": jd_fit_score,
        "projects_certifications": projects_score,
    }

    overall = sum(components[key] * weight for key, weight in WEIGHTS.items())
    overall = round(_clamp(overall), 1)

    breakdown = {
        key: {
            "score": round(components[key], 1),
            "weight": WEIGHTS[key],
            "weighted_contribution": round(components[key] * WEIGHTS[key], 1),
        }
        for key in WEIGHTS
    }

    recommendation = _recommendation_for(overall)

    return overall, breakdown, recommendation, matched_required, missing_required, matched_preferred, missing_preferred


def _recommendation_for(score: float) -> Recommendation:
    if score >= 85:
        return Recommendation.STRONG_MATCH
    if score >= 70:
        return Recommendation.GOOD_MATCH
    if score >= 50:
        return Recommendation.WEAK_MATCH
    return Recommendation.NOT_A_MATCH
