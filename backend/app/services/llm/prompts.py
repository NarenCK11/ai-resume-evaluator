"""Shared prompt text for real LLM-backed providers (Anthropic, Groq, ...).

Kept in one place so every provider asks the model for the exact same
structured evidence schema -- never a final score.
"""
from app.models.job import JobOpening

SYSTEM_PROMPT = """You are a meticulous, unbiased technical recruiter assistant.
You analyze a candidate's resume against a job opening and extract structured,
evidence-based findings. You NEVER invent a final numeric "match score" for the
whole candidate -- that is calculated deterministically by other software from
the fields you provide. You only report what you can find evidence for in the
resume text.

Rules:
- Treat related/synonymous skill names as the same skill (e.g. "JS" == "JavaScript",
  "ReactJS" == "React", "Postgres" == "PostgreSQL", "AWS" == "Amazon Web Services").
  Do not require exact string matches.
- Only include a skill in matched_required_skills / matched_preferred_skills if the
  resume provides real evidence of it (work experience, projects, listed skills).
  Copy the skill name EXACTLY as it appears in the provided required/preferred lists.
- Never consider or mention protected/irrelevant personal characteristics such as
  age, gender, race, ethnicity, religion, marital status, nationality, disability,
  or photographs -- evaluate only job-relevant qualifications.
- Respond with ONLY a single valid JSON object matching the schema described by the
  user message. No markdown fences, no commentary before or after.
"""

JSON_SCHEMA_HINT = """Return a JSON object with EXACTLY these fields:
{
  "matched_required_skills": string[],
  "matched_preferred_skills": string[],
  "experience_years_estimated": number,
  "experience_relevance_score": number (0-100, how relevant the candidate's experience is to this specific role),
  "experience_notes": string,
  "candidate_education_level": one of ["none","high_school","associate","bachelor","master","doctorate"],
  "education_notes": string,
  "job_description_fit_score": number (0-100, holistic semantic fit to the overall job description),
  "job_description_fit_notes": string,
  "relevant_projects_certifications": string[],
  "projects_certifications_score": number (0-100),
  "strengths": string[] (3-5 concise bullet points),
  "concerns": string[] (2-4 concise bullet points, empty array if none),
  "summary": string (2-4 sentence overall summary)
}
"""


def build_user_message(resume_text: str, job: JobOpening) -> str:
    return f"""JOB OPENING
Title: {job.title}
Department: {job.department}
Description: {job.description}
Required skills: {", ".join(job.required_skills) or "(none specified)"}
Preferred skills: {", ".join(job.preferred_skills) or "(none specified)"}
Minimum experience (years): {job.min_experience_years}
Education requirement: {job.education_requirement.value}
Other details: {job.other_details}

RESUME TEXT
\"\"\"
{resume_text[:15000]}
\"\"\"

{JSON_SCHEMA_HINT}"""
