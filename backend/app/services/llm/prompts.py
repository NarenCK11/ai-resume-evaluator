"""Shared prompt text for real LLM-backed providers (Anthropic, Groq, xAI).

Kept in one place so every provider asks the model for the exact same
structured evidence schema -- never a final score.
"""
from app.models.job import JobOpening

SYSTEM_PROMPT = """You are a meticulous, unbiased technical recruiter assistant.
Your PRIMARY task is to read the full job description and the full resume text
and judge, holistically, how well this candidate's background actually fits
this role -- the same way an experienced human recruiter reads a resume
against a JD, not by mechanically checking off a skills list. Base this on
everything in the job description: the responsibilities, the seniority
implied by the title, the required/preferred skills if given, experience and
education expectations, and any other details -- weighed against everything
in the resume: work history, projects, tools used, achievements, and career
trajectory.

You NEVER invent a final numeric "match score" for the whole candidate --
that is calculated deterministically by other software from the structured
fields you provide. You only report what you can find evidence for in the
resume text.

Rules:
- job_description_fit_score is your main holistic judgment call and should
  reflect genuine reasoning about the JD text vs. the resume text -- not be
  derived merely from skill-list overlap. Two candidates with identical
  skill tags can and should get different job_description_fit_score values
  if their actual experience, seniority, and career trajectory fit the role
  differently.
- The job's required/preferred skills lists (if any) are a SECONDARY,
  supplementary check, not the basis of the evaluation. If the job has no
  required/preferred skills listed, do not treat that as a reason to lower
  job_description_fit -- just evaluate resume vs. the job description text
  directly, and return empty arrays for matched_required_skills /
  matched_preferred_skills.
- When skills lists ARE given, treat related/synonymous skill names as the
  same skill (e.g. "JS" == "JavaScript", "ReactJS" == "React",
  "Postgres" == "PostgreSQL", "AWS" == "Amazon Web Services") -- do not
  require exact string matches. Only include a skill in matched_required_skills
  / matched_preferred_skills if the resume provides real evidence of it (work
  experience, projects, listed skills). Copy the skill name EXACTLY as it
  appears in the provided required/preferred lists.
- Never consider or mention protected/irrelevant personal characteristics such as
  age, gender, race, ethnicity, religion, marital status, nationality, disability,
  or photographs -- evaluate only job-relevant qualifications.
- Respond with ONLY a single valid JSON object matching the schema described by the
  user message. No markdown fences, no commentary before or after.
"""

JSON_SCHEMA_HINT = """Return a JSON object with EXACTLY these fields:
{
  "job_description_fit_score": number (0-100, your primary holistic judgment of how
    well the candidate's overall resume fits this specific job description -- weigh
    this like a recruiter reading the whole picture, not a skills checklist),
  "job_description_fit_notes": string (briefly justify the fit score by referencing
    specific parts of the JD and resume),
  "matched_required_skills": string[] (empty if the job listed no required skills),
  "matched_preferred_skills": string[] (empty if the job listed no preferred skills),
  "experience_years_estimated": number,
  "experience_relevance_score": number (0-100, how relevant the candidate's experience is to this specific role),
  "experience_notes": string,
  "candidate_education_level": one of ["none","high_school","associate","bachelor","master","doctorate"],
  "education_notes": string,
  "relevant_projects_certifications": string[],
  "projects_certifications_score": number (0-100),
  "strengths": string[] (3-5 concise bullet points),
  "concerns": string[] (2-4 concise bullet points, empty array if none),
  "summary": string (2-4 sentence overall summary of the JD-vs-resume fit)
}
"""


def build_user_message(resume_text: str, job: JobOpening) -> str:
    required_skills_line = ", ".join(job.required_skills) or "(none specified -- do not penalize for this; judge fit from the job description text instead)"
    preferred_skills_line = ", ".join(job.preferred_skills) or "(none specified)"

    return f"""JOB OPENING
Title: {job.title}
Department: {job.department}
Full job description: {job.description or "(not provided)"}
Required skills: {required_skills_line}
Preferred skills: {preferred_skills_line}
Minimum experience (years): {job.min_experience_years}
Education requirement: {job.education_requirement.value}
Other details: {job.other_details}

CANDIDATE RESUME TEXT
\"\"\"
{resume_text[:15000]}
\"\"\"

Read the job description and the resume above in full, then evaluate this
candidate's fit for this specific role.

{JSON_SCHEMA_HINT}"""
