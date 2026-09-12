"""Explainable resume-to-description matching with rich tech taxonomy and semantic similarity."""
from __future__ import annotations

import re

from app.core.config import get_settings
from app.services.embedding_service import semantic_similarity

SKILLS = {
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "golang", "rust", "php", "ruby", "kotlin", "swift", "scala", "r",
    "react", "angular", "vue", "vue.js", "next.js", "nuxt", "fastapi", "django", "flask", "node.js", "express", "express.js", "spring", "spring boot", "laravel", "rails", "asp.net", "tailwind", "tailwind css", "bootstrap", "redux", "zustand", "graphql", "rest", "rest api", "grpc",
    "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "dynamodb", "cassandra", "firebase", "supabase",
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions", "linux", "bash", "git", "ci/cd", "microservices", "serverless",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "opencv", "nlp", "llm", "openai", "langchain", "machine learning", "deep learning", "data analysis", "powerbi", "tableau", "spark", "hadoop", "kafka", "rabbitmq", "celery",
    "agile", "scrum", "jira", "unit testing", "jest", "cypress", "playwright", "pytest", "system design", "data structures", "algorithms", "html", "css",
}

STOP_WORDS = {
    "about", "after", "again", "all", "also", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before",
    "being", "between", "both", "but", "by", "can", "duties", "each", "experience", "for", "from", "has", "have", "having",
    "how", "if", "in", "into", "is", "it", "its", "job", "more", "must", "not", "of", "on", "only", "or", "other", "our",
    "out", "over", "preferred", "required", "role", "should", "skills", "so", "some", "strong", "such", "team", "than",
    "that", "the", "their", "them", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "using", "very", "was", "we", "well", "were", "what", "when", "where", "which", "while", "who", "will",
    "with", "work", "would", "year", "years", "you", "your", "ability", "development", "building", "working"
}


def _norm(text: str) -> str:
    return " " + re.sub(r"\s+", " ", text.lower()) + " "


def _present(term: str, text: str) -> bool:
    escaped = re.escape(term).replace(r"\ ", r"\s+")
    return bool(re.search(r"(?<![\w+#.])" + escaped + r"(?![\w+#.])", text, re.I))


def _keywords(text: str) -> set[str]:
    raw_words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#.-]{1,25}\b", text)
    cleaned = set()
    for w in raw_words:
        w_clean = w.strip(".-,").lower()
        if len(w_clean) >= 3 and w_clean not in STOP_WORDS and not w_clean.isdigit():
            cleaned.add(w_clean)
    return cleaned


def match_resume_to_job(resume_text: str, job_description: str) -> dict:
    resume = _norm(resume_text)
    job = _norm(job_description)
    requested_skills = sorted(skill for skill in SKILLS if _present(skill, job))
    matched_skills = [skill for skill in requested_skills if _present(skill, resume)]
    missing_skills = [skill for skill in requested_skills if skill not in matched_skills]
    
    # A partial match identifies a component of a compound requirement
    partially = [skill for skill in missing_skills if any(part in resume for part in skill.replace("/", " ").split() if len(part) > 3)]
    
    job_words, resume_words = _keywords(job_description), _keywords(resume_text)
    meaningful = sorted(job_words)[:250]
    matched_keywords = sorted(set(meaningful).intersection(resume_words))[:40]
    missing_keywords = sorted(set(meaningful).difference(resume_words))[:40]

    skill_score = 100 * len(matched_skills) / len(requested_skills) if requested_skills else 60
    keyword_score = 100 * len(matched_keywords) / max(1, min(len(meaningful), 40))

    required_years = [int(v) for v in re.findall(r"\b(\d{1,2})\+?\s+years?", job_description.lower())]
    resume_year_mentions = len(re.findall(r"\b(?:19|20)\d{2}\b", resume_text))
    experience_score = 85 if not required_years else min(100, 30 + resume_year_mentions * 15)
    education_score = 80 if ("bachelor" in resume or "master" in resume or "degree" in resume or "b.tech" in resume or "bs" in resume) else 40

    try:
        semantic = semantic_similarity(resume_text, job_description)
    except Exception:
        semantic = None

    settings = get_settings()
    weights = {
        "skill": settings.skill_match_weight,
        "keyword": settings.keyword_match_weight,
        "semantic": settings.semantic_match_weight,
        "experience": settings.experience_match_weight,
        "education": settings.education_match_weight,
    }
    values = {
        "skill": skill_score,
        "keyword": keyword_score,
        "experience": experience_score,
        "education": education_score,
    }
    if semantic is not None:
        values["semantic"] = semantic * 100
    else:
        remaining = 1 - weights["semantic"]
        weights = {key: value / remaining for key, value in weights.items() if key != "semantic"}

    score = round(sum(values[key] * weights[key] for key in values), 1)

    recommendations = []
    if missing_skills:
        recommendations.append("Where truthful, highlight experience with missing skills: " + ", ".join(missing_skills[:6]) + ".")
    if missing_keywords:
        recommendations.append("Incorporate target job keywords into bullet points: " + ", ".join(missing_keywords[:6]) + ".")
    if not recommendations:
        recommendations.append("Tailor your professional summary and recent project bullet points directly for this position.")

    return {
        "job_match_score": score,
        "matched_skills": matched_skills,
        "partially_matched_skills": partially,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "strengths_for_this_job": [f"Matches requested skill: {skill}" for skill in matched_skills[:8]],
        "gaps_for_this_job": [f"Missing skill evidence: {skill}" for skill in missing_skills[:8]],
        "recommendations": recommendations,
        "semantic_similarity": semantic,
    }
