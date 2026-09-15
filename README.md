<div align="center">

# 🎯 HireLens — AI Resume Analyzer & ATS Optimization Platform

<p align="center">
  <strong>Transform raw resumes into interview-winning ATS-optimized applications using AI evaluation and deterministic rule auditing.</strong>
</p>

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991.svg?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<br />

![HireLens Hero Banner](./docs/images/hero-banner.png)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Visual Showcase & Screenshots](#-visual-showcase--screenshots)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Docker & Production Deployment](#-docker--production-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**HireLens** is a full-stack, enterprise-grade AI Resume Analysis and ATS (Applicant Tracking System) Optimization platform. Designed for Job Seekers, HR Professionals, and Recruitment Platforms, HireLens audits resumes against industry ATS compliance rules, identifies skill gaps, evaluates formatting, and provides actionable, side-by-side **Before vs After** bullet point improvements.

Unlike simple AI wrappers, HireLens utilizes a **Hybrid Dual-Engine Architecture**:
1. **Deterministic Rule Engine**: Instantaneous, zero-latency rule audit evaluating contact details, standard headers, section presence, quantifiable impact metrics, and action verbs.
2. **OpenAI GPT Evaluator**: Deep semantic analysis providing contextual scoring, strength/weakness identification, missing section warnings, and tailored rephrasing recommendations.

If an API key is un-configured or temporarily unavailable, HireLens automatically switches to its **Resilient Local Fallback Engine**, ensuring seamless local development and testing.

---

## 🔥 Key Features

- 🔐 **JWT Authentication & Security**: Secure user registration, password hashing (bcrypt), token persistence, and auto-redirect session handling.
- 📄 **Drag-and-Drop Resume Studio**: Native support for **PDF** and **DOCX** document parsing with client/server 5MB file validation.
- ⚡ **Deterministic ATS Audit Engine**: 14+ automated checks auditing contact info, section structure, typography, action verbs, and numerical impact.
- 🧠 **AI Section Breakdown**: Comprehensive numerical scores for Skills, Experience Impact, Formatting, Keyword Density, and Overall Match (0–100 scale).
- 💡 **Actionable Before vs After Suggestions**: Real-world rephrasing suggestions comparing weak original bullet points against ATS-optimized alternatives.
- 🎯 **Job Description Matcher**: Direct comparison against targeted job postings to calculate Fit %, matched vs missing skills, and target keyword density.
- 📊 **Interactive SaaS Analytics Dashboard**: Recharts-powered analytics featuring Score Distribution Bar Charts, ATS Score History Line Charts, and Quick Action uploaders.
- 📁 **Historical Evaluation Archives**: Route (`/history`) to search, filter, sort, and manage previous resume analyses.
- 🐳 **Docker-Ready**: Standardized Dockerfile and `docker-compose.yml` for simplified microservices orchestration.

---

## 📸 Visual Showcase & Screenshots

### 1. Landing Page & Real-Time Scanner Preview
Hero section with instant ATS rule check and live vacancy preview.
![Landing Page](./docs/images/01-landing-page.png)

### 2. AI Career Hub Dashboard
Central command center tracking Resume Quality Score, ATS Readiness, LinkedIn Branding score, and GitHub Code Score.
![SaaS Dashboard Preview](./docs/images/02-dashboard.png)

### 3. AI Resume Builder — 10 Original ATS Templates
Select from 10 original ATS-friendly layouts (Modern, Minimal, Tech, Executive, Classic, Professional, Creative, Student, etc.).
![Resume Builder Templates](./docs/images/03-resume-builder-templates.png)

### 4. AI Resume Builder — Live Editor & Vector PDF Export
Form-based live editing, AI content expansion, real-time paper rendering, and vector PDF/DOCX downloads.
![Resume Builder Editor](./docs/images/04-resume-builder-editor.png)

### 5. Upload Resume & Instant ATS Audit
Drag-and-drop document parser supporting PDF & DOCX up to 5MB with automated rule scoring.
![Upload Resume](./docs/images/05-upload-resume.png)

### 6. LinkedIn Branding & Keywords Audit
Privacy-compliant LinkedIn profile optimizer evaluating headlines, about sections, and recruiter keyword density.
![LinkedIn Optimizer](./docs/images/06-linkedin-optimizer.png)

### 7. GitHub Profile & Project Importer
Analyze public GitHub repositories, primary language distributions, and generate resume-ready project descriptions.
![GitHub Importer](./docs/images/07-github-importer.png)

### 8. Live Job Search & Discovery
Multi-source search engine aggregating vacancies across Naukri, LinkedIn, Indeed, and Remotive with resume match filters.
![Job Search & Discovery](./docs/images/08-job-discovery.png)

### 9. Personalized Recommended Jobs Engine
Hybrid matching algorithm scoring live job openings against the candidate's actual resume profile.
![Recommended Jobs](./docs/images/09-recommended-jobs.png)

---

## 🏗️ System Architecture

```
                               ┌──────────────────────────────────┐
                               │       Client Web Browser        │
                               │   React 18 + Vite + Tailwind    │
                               └─────────────────┬────────────────┘
                                                 │ HTTPS / REST API
                                                 ▼
                               ┌──────────────────────────────────┐
                               │       FastAPI API Gateway        │
                               │  Uvicorn + Pydantic + JWT Auth   │
                               └────────┬─────────────────┬───────┘
                                        │                 │
                  ┌─────────────────────┘                 └──────────────────────┐
                  ▼                                                              ▼
    ┌──────────────────────────┐                                   ┌──────────────────────────┐
    │  Document Parser Engine  │                                   │ Deterministic ATS Engine │
    │   PyMuPDF & python-docx  │                                   │ 14+ Hardcoded Rule Audits│
    └─────────────┬────────────┘                                   └─────────────┬────────────┘
                  │                                                              │
                  └─────────────────────┐                 ┌──────────────────────┘
                                        ▼                 ▼
                               ┌──────────────────────────────────┐
                               │        AI Evaluation Core        │
                               │  OpenAI GPT-4o / Local Fallback  │
                               └────────────────┬─────────────────┘
                                                │
                                                ▼
                               ┌──────────────────────────────────┐
                               │         Data Persistence         │
                               │ PostgreSQL / SQLite + SQLAlchemy │
                               └──────────────────────────────────┘
```

![Technical Architecture Diagram](./docs/images/architecture-diagram.png)

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Modern component-driven UI architecture |
| **Build Tooling** | Vite | Lightning-fast HMR frontend bundler |
| **Styling & Motion** | Tailwind CSS + Framer Motion | Fluid dark-mode aesthetic with micro-interactions |
| **Data Visualization** | Recharts | Responsive analytical charts & graphs |
| **Icons & Notifications**| Lucide React + React Hot Toast | Clean SVG icon set and toast feedback |
| **Backend Framework** | Python 3.11+ / FastAPI | High-performance asynchronous REST API framework |
| **ORM & Database** | SQLAlchemy 2.0 + PostgreSQL | Enterprise object-relational mapping and database |
| **Database Migrations** | Alembic | Version-controlled database schema management |
| **Document Processing** | PyMuPDF (fitz) + python-docx | High-fidelity text extraction from PDF and Word docs |
| **AI Integration** | OpenAI API (GPT-4o) | Structured JSON output evaluation engine |
| **Testing Suite** | Pytest | Automated test coverage for endpoints, engines, and auth |
| **Containerization** | Docker + Docker Compose | Isolated multi-container environments |

---

## 📁 Project Directory Structure

```
AI-Analyzer_CV/
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/              # API route controllers (auth, resumes, jobs, analysis)
│   │   ├── core/             # Security, JWT, config settings
│   │   ├── db/               # Database sessions and base models
│   │   ├── models/           # SQLAlchemy database schemas
│   │   ├── schemas/          # Pydantic request/response validation schemas
│   │   ├── services/         # ATS engine, parser, AI evaluator, job matcher
│   │   └── main.py           # FastAPI entrypoint & middleware configuration
│   ├── tests/                # Pytest unit & integration test suite
│   ├── Dockerfile            # Container definition for backend
│   ├── docker-compose.yml    # Multi-container orchestration
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Sample environment configuration
├── frontend/
│   ├── public/               # Static assets & logos
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Cards, Charts)
│   │   ├── context/          # React Context (AuthContext)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # View routes (Dashboard, Analysis, JobMatch, History)
│   │   ├── services/         # Axios API clients
│   │   ├── App.jsx           # Routing & application layout
│   │   └── main.jsx          # Application entrypoint
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.js        # Vite bundler setup
├── docs/
│   └── images/               # High-resolution documentation preview graphics
├── .gitignore                # Git exclusion rules
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed on your machine:
- **Python**: v3.11 or higher
- **Node.js**: v18.0.0 or higher
- **Git**: Installed and configured

---

### 1. Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Copy sample environment file
cp .env.example .env

# 3. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# 4. Install required dependencies
pip install -r requirements.txt

# 5. Run database migrations (or auto-initialize SQLite/PostgreSQL)
alembic upgrade head

# 6. Start the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- 🟢 **Backend API Base**: `http://localhost:8000`
- 📚 **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- 🩺 **Health Check**: `http://localhost:8000/health`

---

### 2. Frontend Setup

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Copy sample environment file
cp .env.example .env

# 3. Install NPM packages
npm install

# 4. Start Vite development server
npm run dev
```

- 🌐 **Web Interface**: `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend Environment Variables (`backend/.env`)

```env
# Server Configuration
PROJECT_NAME="HireLens AI Resume Analyzer"
API_V1_STR="/api/v1"
SECRET_KEY="your-super-secret-jwt-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration (PostgreSQL / SQLite)
DATABASE_URL="sqlite:///./resume_analyzer.db"
# For PostgreSQL: postgresql+psycopg://user:password@localhost:5432/hirelens_db

# OpenAI API Key (Optional: Falls back to deterministic NLP engine if omitted)
OPENAI_API_KEY="sk-proj-..."

# CORS Configuration
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

### Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_URL="http://localhost:8000"
```

---

## 🔌 API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new user account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/v1/auth/me` | Protected | Fetch current logged-in user details |
| `POST` | `/api/v1/resumes/upload` | Protected | Upload PDF/DOCX resume file |
| `POST` | `/api/v1/resumes/analyze/{id}` | Protected | Perform AI evaluation & ATS rule audit |
| `GET` | `/api/v1/resumes/history` | Protected | Fetch candidate's past resume analyses |
| `POST` | `/api/v1/jobs/match` | Protected | Compare resume against job description |
| `GET` | `/health` | Public | System status and database health check |

---

## 🧪 Testing & Quality Assurance

Run the automated backend Pytest suite to verify API endpoints, database operations, auth guards, and ATS audit logic:

```bash
cd backend
.venv/bin/pytest -v
```

Expected output:
```text
======================== 16 passed in 14.66s ========================
```

---

## 🐳 Docker Deployment

To launch the full application stack using Docker Compose:

```bash
docker compose up --build
```

This starts:
- **FastAPI Application**: Exposed on `http://localhost:8000`
- **PostgreSQL Database**: Port `5432`

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<div align="center">
  <sub>Built with ❤️ using React, FastAPI, Tailwind CSS, and OpenAI</sub>
</div>
