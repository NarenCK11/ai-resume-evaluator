# TalentScope — AI Resume Evaluator

A working HR SaaS application for screening and ranking candidate resumes
against job openings. HR users sign up, create job openings, upload
candidate resumes, and get an explainable score out of 100 for every
candidate — with automatic, live ranking.

```
Login → Create Job → Add Candidate → Upload Resume → Parse Resume
      → AI Evaluation → Score /100 → Automatic Ranking
```

## Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: SQLite via SQLAlchemy, versioned with Alembic migrations
  (swap `DATABASE_URL` to point at PostgreSQL later — no code changes needed)
- **Auth**: JWT (bcrypt-hashed passwords)
- **Resume parsing**: PDF (`pdfplumber`), DOCX (`python-docx`), TXT
- **AI evaluation**: pluggable provider interface — xAI Grok, Groq (free
  tier), Anthropic Claude, or a dependency-free mock provider that works
  with no API key

## How scoring works

The evaluation's primary job is reading the full resume against the full
job description, the way a recruiter would — not mechanically checking off
a skills list. Required/preferred skills are an **optional, secondary**
check: if HR doesn't list any, the AI still evaluates the resume against the
job description text directly; if HR does list some, they're additionally
verified and shown.

An LLM provider (or the mock heuristic provider) only produces **structured
evidence** about a resume: a holistic job-description-fit rating (its main
signal), which listed required/preferred skills it found evidence for (if
any were given), an experience-relevance rating, detected education level,
relevant projects/certifications, strengths, and concerns. It never returns
a final score.

The final `/100` score is always computed by
[`backend/app/services/scoring.py`](backend/app/services/scoring.py) using
these weights:

| Component | Weight |
|---|---|
| Job description fit (holistic resume vs. JD) | 40% |
| Experience relevance | 25% |
| Required skills match | 15% (only if the job lists any) |
| Education fit | 10% |
| Projects & certifications | 5% |
| Preferred skills match | 5% (only if the job lists any) |

If a job doesn't specify required and/or preferred skills, that weight is
folded back into **Job description fit** instead of being wasted on an
always-100 component — so a skills-less job still gets a real, differentiated
score driven entirely by how well the resume actually matches the job
description, rather than every candidate getting an inflated free score.

Missing-skill lists (when skills are specified) are derived deterministically
(job's required/preferred list minus validated matches) rather than trusted
from the LLM, so they're always consistent. Skill matching is synonym-aware
(`JS`/`JavaScript`, `ReactJS`/`React`, `AWS`/`Amazon Web Services`, etc. —
see [`skills_taxonomy.py`](backend/app/services/skills_taxonomy.py)) rather
than exact-string matching.

Recommendation bands: **Strong Match** ≥ 85, **Good Match** ≥ 70,
**Weak Match** ≥ 50, otherwise **Not a Match**.

Ranking is never a stored field — the candidate list for a job is always
sorted live by each candidate's latest evaluation score, so adding or
re-evaluating a candidate automatically reorders the table.

## Prerequisites

- Python 3.11+
- Node.js 18+

## Setup & run

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux

alembic upgrade head            # creates backend/app.db with the full schema

uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000` (interactive API docs at
`http://localhost:8000/docs`).

#### Choosing an LLM provider

Set `LLM_PROVIDER` in `backend/.env` to one of:

- **`mock`** — no API key needed. Regex/keyword + synonym-taxonomy heuristics
  plus a JD-vs-resume keyword-overlap check
  ([`services/llm/mock.py`](backend/app/services/llm/mock.py)). Good for
  offline development.
- **`groq`** — real LLM evaluation via [Groq](https://console.groq.com/keys),
  which has a genuine no-billing free tier. Groq keys start with `gsk_`.
  ```
  LLM_PROVIDER=groq
  GROQ_API_KEY=gsk_...
  GROQ_MODEL=llama-3.3-70b-versatile
  ```
  If you hit free-tier rate limits, switch `GROQ_MODEL` to
  `llama-3.1-8b-instant` — smaller/faster with a higher free-tier request
  allowance, at a small quality cost.
- **`xai`** — real LLM evaluation via [xAI's Grok](https://console.x.ai)
  (OpenAI-compatible API). xAI keys start with `xai-`. Note: xAI has **no
  no-billing free tier** — a new team needs a payment method/credits added
  at console.x.ai before any request will succeed, even light usage.
  ```
  LLM_PROVIDER=xai
  XAI_API_KEY=xai-...
  XAI_MODEL=grok-4-fast
  ```
- **`anthropic`** — real LLM evaluation via Claude (paid).
  ```
  LLM_PROVIDER=anthropic
  ANTHROPIC_API_KEY=sk-ant-...
  ```

**Groq and xAI are different services** despite the similar names — don't
mix up their keys (`gsk_...` vs `xai-...`).

All four implement the same `LLMProvider` interface
([`services/llm/base.py`](backend/app/services/llm/base.py)) and return the
same structured evidence shape, so swapping providers never touches scoring,
API routes, or the frontend.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` requests to the
backend automatically (see `vite.config.ts`) — no extra configuration
needed for local development.

### 3. Use it

Open `http://localhost:5173`, sign up as an HR user, create a job opening,
open it, and add a candidate with a resume (PDF/DOCX/TXT). The evaluation
runs synchronously on upload — the candidate appears in the ranking table
with a score and recommendation within a few seconds.

## Environment variables

See [`backend/.env.example`](backend/.env.example) for the full list
(`SECRET_KEY`, `DATABASE_URL`, `LLM_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL`,
`XAI_API_KEY`, `XAI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`,
`UPLOAD_DIR`, `MAX_UPLOAD_MB`, `CORS_ORIGINS`) and
[`frontend/.env.example`](frontend/.env.example) for `VITE_API_BASE_URL`
(only needed if the frontend is deployed separately from the backend).
Never commit a real `.env` file — both are gitignored.

## Project structure

```
backend/
  app/
    api/          FastAPI routers (auth, jobs, candidates, evaluations, dashboard)
    core/          config + JWT/password security
    db/            SQLAlchemy engine/session/base
    models/        SQLAlchemy models (User, JobOpening, Candidate, Evaluation)
    schemas/        Pydantic request/response schemas
    services/
      llm/          LLMProvider interface, xAI + Groq + Anthropic + mock implementations
      resume_parser.py    PDF/DOCX/TXT text extraction
      skills_taxonomy.py  synonym-aware skill matching
      scoring.py           deterministic /100 scoring engine
      evaluation_service.py orchestrates parse -> LLM -> score -> persist
  alembic/         versioned DB migrations
frontend/
  src/
    api/           typed API client functions
    components/    ui/ (buttons, cards, modals...), jobs/, candidates/, layout/
    context/       auth context
    pages/         Dashboard, Jobs, Job Detail, Candidate Detail, Login/Signup
```

## Notes

- Uploaded resumes are stored under `backend/uploads/` (gitignored) and
  never committed.
- The mock LLM provider is intentionally simple (regex/keyword heuristics)
  so the app is fully functional offline; swap to `LLM_PROVIDER=groq`,
  `xai`, or `anthropic` for genuinely AI-driven evidence extraction.
- Groq's free tier applies request/token rate limits per model. If an
  evaluation fails with a rate-limit error, the candidate is marked
  "Evaluation failed" with the error message shown on their detail page —
  click "Re-evaluate" after waiting a moment, or switch `GROQ_MODEL` to
  `llama-3.1-8b-instant`.
- If xAI evaluations fail with a `403 permission-denied` mentioning
  "no credits or licenses", that's an xAI account/billing issue, not an app
  bug — add a payment method at the console.x.ai URL in the error message.
- Protected/irrelevant personal characteristics (age, gender, etc.) are
  never part of the evaluation prompt or scoring model.
