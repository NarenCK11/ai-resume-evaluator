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
- **AI evaluation**: pluggable provider interface — a real Anthropic Claude
  provider, or a dependency-free mock provider that works with no API key

## How scoring works

An LLM provider (or the mock heuristic provider) only produces **structured
evidence** about a resume: which required/preferred skills it found evidence
for, an experience-relevance rating, detected education level, JD-fit rating,
relevant projects/certifications, strengths, and concerns. It never returns a
final score.

The final `/100` score is always computed by
[`backend/app/services/scoring.py`](backend/app/services/scoring.py) using
fixed weights:

| Component | Weight |
|---|---|
| Required skills match | 35% |
| Experience relevance | 25% |
| Preferred skills match | 10% |
| Education fit | 10% |
| Overall job description fit | 10% |
| Projects & certifications | 10% |

Missing-skill lists are derived deterministically (job's required/preferred
list minus validated matches) rather than trusted from the LLM, so they're
always consistent. Skill matching is synonym-aware (`JS`/`JavaScript`,
`ReactJS`/`React`, `AWS`/`Amazon Web Services`, etc. — see
[`skills_taxonomy.py`](backend/app/services/skills_taxonomy.py)) rather than
exact-string matching.

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

The default `.env` uses `LLM_PROVIDER=mock`, so the app works immediately
with **no API key** — the mock provider does real (if simple) regex/keyword
+ synonym-taxonomy analysis of each resume. To use real AI evaluation via
Anthropic Claude, edit `backend/.env`:

```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

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
(`SECRET_KEY`, `DATABASE_URL`, `LLM_PROVIDER`, `ANTHROPIC_API_KEY`,
`ANTHROPIC_MODEL`, `UPLOAD_DIR`, `MAX_UPLOAD_MB`, `CORS_ORIGINS`) and
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
      llm/          LLMProvider interface, Anthropic + mock implementations
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
  so the app is fully functional offline; swap to `LLM_PROVIDER=anthropic`
  for genuinely AI-driven evidence extraction.
- Protected/irrelevant personal characteristics (age, gender, etc.) are
  never part of the evaluation prompt or scoring model.
