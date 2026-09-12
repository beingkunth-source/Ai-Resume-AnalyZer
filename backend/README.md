# AI Resume Analyzer API

A production-oriented FastAPI backend for authenticated resume uploads, deterministic ATS checks, OpenAI structured analysis, job matching with CRUD, and a dashboard. The API always returns a predictable success envelope (`{"success": true, "data": ...}`); failures return `{"success": false, "message": ...}`.

## Features

- JWT registration, login, and protected-user dependency
- Safe PDF/DOCX uploads with MIME, signature, size, empty-file, and text-extraction checks
- PyMuPDF and python-docx extraction with no OCR dependency
- Transparent, rule-based ATS scoring that works without an AI key
- OpenAI Responses API structured-output analysis, validated by Pydantic before storage
- Explainable job matching with optional embedding cosine similarity
- Full job description CRUD (create, list, get, delete) with ownership enforcement
- Resume, analysis, and job-match persistence with ownership checks and cascade deletion
- Dashboard with aggregate metrics (total resumes, analyses, averages, recent items)
- OpenAPI documentation, health check, CORS, Alembic, Docker, docker-compose, and pytest coverage

## Stack

Python 3.11+, FastAPI, SQLAlchemy 2.x, PostgreSQL/psycopg, Alembic, Pydantic v2, python-jose, bcrypt, PyMuPDF, python-docx, OpenAI, and optional pgvector.

## Folder Structure

```text
backend/
  app/api/          HTTP route handlers (auth, resume, analysis, jobs, dashboard)
  app/core/         settings, JWT, dependencies
  app/database/     SQLAlchemy setup and ORM models
  app/models/       compatibility exports for ORM models
  app/schemas/      Pydantic contracts
  app/services/     parsing, ATS, OpenAI, matching logic
  app/utils/        file validation and response helpers
  alembic/          database migration environment and revisions
  tests/            mocked integration/unit tests
  uploads/          uploaded resume files (git-ignored)
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `sqlite:///./resume_analyzer.db` |
| `OPENAI_API_KEY` | OpenAI API key (optional for ATS) | `None` |
| `OPENAI_MODEL` | Chat model for analysis | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model for semantic match | `text-embedding-3-small` |
| `JWT_SECRET_KEY` | Secret for JWT signing | dev default |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes | `60` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `CORS_ORIGINS` | Comma-separated CORS origins | Uses `FRONTEND_URL` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size in MB | `5` |
| `OPENAI_TIMEOUT_SECONDS` | OpenAI API timeout | `30` |
| `SKILL_MATCH_WEIGHT` | Weight for skill matching (0-1) | `0.4` |
| `KEYWORD_MATCH_WEIGHT` | Weight for keyword matching (0-1) | `0.2` |
| `SEMANTIC_MATCH_WEIGHT` | Weight for semantic similarity (0-1) | `0.2` |
| `EXPERIENCE_MATCH_WEIGHT` | Weight for experience matching (0-1) | `0.1` |
| `EDUCATION_MATCH_WEIGHT` | Weight for education matching (0-1) | `0.1` |

## Installation

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET_KEY, and optionally OPENAI_API_KEY

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Database Migration

```bash
# Create tables
alembic upgrade head

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Local Development

```bash
uvicorn app.main:app --reload
```

Open:
- Health: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Docker

```bash
docker build -t ai-resume-analyzer .
docker run --rm -p 8000:8000 --env-file .env -e PORT=8000 ai-resume-analyzer
```

## Docker Compose (Local Development with PostgreSQL)

```bash
docker compose up --build
```

This starts a PostgreSQL 16 instance and the backend. The backend automatically runs migrations on startup.

## Testing

```bash
pytest -q
```

Tests use SQLite and mock `analyze_resume_with_ai`, so they never call OpenAI. Coverage includes:
- Registration, login, JWT authentication, and `/health`
- Resume upload, list, get, delete, and ownership enforcement
- ATS scoring determinism and explainability
- Analysis creation with mocked AI and ownership protection
- Job description CRUD and ownership enforcement
- Job matching flow with skill and keyword identification
- Dashboard metrics (empty state and populated state)
- Unauthorized access rejection

## Render Deployment

1. Create a Render PostgreSQL instance and copy its internal connection URL into `DATABASE_URL`.
2. Deploy this `backend` directory as a Docker service, or set:
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables in Render:
   - `DATABASE_URL` (required)
   - `JWT_SECRET_KEY` (required, use a long random string)
   - `OPENAI_API_KEY` (optional, enables AI analysis)
   - `OPENAI_MODEL` (optional)
   - `FRONTEND_URL` (set to your deployed frontend URL)
4. Run `alembic upgrade head` as a Render pre-deploy command.
5. Set health check path to `/health`.

## API Endpoints

### Authentication

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register and receive JWT |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/auth/me` | Bearer | Get authenticated user |

### Resumes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/resume/upload` | Bearer | Upload PDF or DOCX resume |
| GET | `/api/resume` | Bearer | List user's resumes |
| GET | `/api/resume/{id}` | Bearer | Get resume metadata |
| DELETE | `/api/resume/{id}` | Bearer | Delete resume and analyses |

### Analysis

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/analysis/{resume_id}?force=false` | Bearer | Run AI + ATS analysis |
| GET | `/api/analysis` | Bearer | List analysis history |
| GET | `/api/analysis/{id}` | Bearer | Get full analysis |

### Jobs

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/jobs` | Bearer | Create job description |
| GET | `/api/jobs` | Bearer | List user's job descriptions |
| GET | `/api/jobs/{id}` | Bearer | Get job description |
| DELETE | `/api/jobs/{id}` | Bearer | Delete job description |
| POST | `/api/jobs/match` | Bearer | Match resume to job description |

### Dashboard

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | Bearer | Aggregate dashboard metrics |

### System

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check (Render) |

## Example API Calls

### Register

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "securepass123"}'
```

### Upload Resume

```bash
curl -X POST http://localhost:8000/api/resume/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@resume.pdf"
```

### Create Job Description

```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Backend Developer", "company": "Acme Corp", "description": "Looking for a Python developer with FastAPI and PostgreSQL experience."}'
```

### Match Resume to Job

```bash
curl -X POST http://localhost:8000/api/jobs/match \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"resume_id": 1, "job_id": 1}'
```

### Run Analysis

```bash
curl -X POST http://localhost:8000/api/analysis/1 \
  -H "Authorization: Bearer <token>"
```

### Dashboard

```bash
curl http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer <token>"
```
