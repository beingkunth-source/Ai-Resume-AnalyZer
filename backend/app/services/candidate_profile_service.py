from __future__ import annotations

import logging
import re
from typing import Any
from app.schemas.job import CandidateProfile

logger = logging.getLogger(__name__)

# Comprehensive taxonomy dictionaries for high-precision extraction
PROGRAMMING_LANGS = {
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
    "rust", "php", "ruby", "kotlin", "swift", "scala", "r", "c", "sql", "html", "css", "bash"
}

FRAMEWORKS = {
    "react", "angular", "vue", "vue.js", "next.js", "nuxt", "fastapi", "django",
    "flask", "node.js", "express", "express.js", "spring", "spring boot", "laravel",
    "rails", "asp.net", "tailwind", "bootstrap", "redux", "zustand", "graphql", "nest.js"
}

DATABASES = {
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
    "dynamodb", "sqlite", "cassandra", "firebase", "supabase", "oracle", "mariadb"
}

CLOUD_TECH = {
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
    "ansible", "jenkins", "github actions", "ci/cd", "serverless", "cloud formation"
}

TOOLS = {
    "git", "github", "gitlab", "jira", "docker", "postman", "vscode", "figma",
    "linux", "pycharm", "jupyter", "maven", "gradle", "npm", "webpack", "vite"
}

SOFT_SKILLS = {
    "communication", "teamwork", "leadership", "problem solving", "critical thinking",
    "adaptability", "time management", "collaboration", "agile", "scrum", "mentorship"
}

TECH_DISPLAY_MAP = {
    "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript", "java": "Java",
    "fastapi": "FastAPI", "react": "React", "next.js": "Next.js", "vue": "Vue.js", "angular": "Angular",
    "django": "Django", "flask": "Flask", "node.js": "Node.js", "express": "Express", "postgresql": "PostgreSQL",
    "mysql": "MySQL", "mongodb": "MongoDB", "redis": "Redis", "sqlite": "SQLite", "aws": "AWS",
    "gcp": "GCP", "azure": "Azure", "docker": "Docker", "kubernetes": "Kubernetes", "terraform": "Terraform",
    "git": "Git", "github": "GitHub", "rest": "REST API", "rest api": "REST API", "html": "HTML", "css": "CSS",
    "sql": "SQL", "c++": "C++", "c#": "C#", "linux": "Linux"
}


def _fmt_tech(skill: str) -> str:
    s_lower = skill.lower()
    return TECH_DISPLAY_MAP.get(s_lower, skill.title())


def extract_candidate_profile(resume_text: str, analysis_json: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Extract a comprehensive candidate job profile from raw resume text and/or analysis JSON.
    """
    text_lower = " " + re.sub(r"\s+", " ", resume_text.lower()) + " "
    
    # 1. Tech Skills extraction
    found_langs = [lang for lang in sorted(PROGRAMMING_LANGS) if _has_word(lang, text_lower)]
    found_frameworks = [fw for fw in sorted(FRAMEWORKS) if _has_word(fw, text_lower)]
    found_dbs = [db for db in sorted(DATABASES) if _has_word(db, text_lower)]
    found_cloud = [cloud for cloud in sorted(CLOUD_TECH) if _has_word(cloud, text_lower)]
    found_tools = [tool for tool in sorted(TOOLS) if _has_word(tool, text_lower)]
    found_soft = [ss for ss in sorted(SOFT_SKILLS) if _has_word(ss, text_lower)]
    
    all_tech = sorted(list(set(found_langs + found_frameworks + found_dbs + found_cloud + found_tools)))

    # 2. Education & Degree
    degree = "Bachelor's Degree"
    if "master" in text_lower or "m.tech" in text_lower or "ms " in text_lower or "msc" in text_lower:
        degree = "Master's Degree"
    elif "phd" in text_lower or "doctorate" in text_lower:
        degree = "Ph.D."
    elif "b.tech" in text_lower or "b.e" in text_lower or "bachelor" in text_lower or "bs " in text_lower or "bsc" in text_lower or "bca" in text_lower:
        degree = "Bachelor's Degree"
    elif "diploma" in text_lower:
        degree = "Diploma"

    education_items = []
    if "computer science" in text_lower or "cse" in text_lower:
        education_items.append("B.Tech / B.E. in Computer Science")
    elif "information technology" in text_lower or " it " in text_lower:
        education_items.append("Information Technology")
    else:
        education_items.append(degree)

    # 3. Experience level & years
    years_found = [int(v) for v in re.findall(r"\b(\d{1,2})\+?\s+years?", text_lower)]
    years_exp = float(max(years_found)) if years_found else 0.0
    
    if years_exp == 0 and ("fresher" in text_lower or "intern" in text_lower or "student" in text_lower):
        exp_level = "Fresher"
    elif years_exp <= 2:
        exp_level = "Entry Level"
    elif years_exp <= 5:
        exp_level = "Mid Level"
    else:
        exp_level = "Senior"

    has_internship = "intern" in text_lower or "internship" in text_lower
    has_projects = "project" in text_lower or "projects" in text_lower or "github" in text_lower

    # 4. Target Job Roles derivation
    target_roles = []
    if "python" in found_langs and ("fastapi" in found_frameworks or "django" in found_frameworks or "flask" in found_frameworks or "postgresql" in found_dbs):
        target_roles.append("Backend Developer")
        target_roles.append("Python Developer")
    if "react" in found_frameworks or "vue" in found_frameworks or "angular" in found_frameworks or "next.js" in found_frameworks:
        target_roles.append("Frontend Developer")
    if ("react" in found_frameworks or "javascript" in found_langs) and ("python" in found_langs or "node.js" in found_frameworks or "express" in found_frameworks):
        target_roles.append("Full Stack Developer")
    if "aws" in found_cloud or "docker" in found_cloud or "kubernetes" in found_cloud or "terraform" in found_cloud:
        target_roles.append("DevOps Engineer")
        target_roles.append("Cloud Engineer")
    if "machine learning" in text_lower or "tensorflow" in text_lower or "pytorch" in text_lower or "data science" in text_lower:
        target_roles.append("AI / Machine Learning Engineer")
        target_roles.append("Data Scientist")

    if not target_roles:
        target_roles = ["Software Engineer", "Junior Software Developer", "Tech Associate"]

    # Deduplicate roles
    target_roles = list(dict.fromkeys(target_roles))[:5]

    # 5. Location & Remote Preferences
    loc_prefs = []
    if "bangalore" in text_lower or "bengaluru" in text_lower:
        loc_prefs.append("Bangalore")
    if "hyderabad" in text_lower:
        loc_prefs.append("Hyderabad")
    if "pune" in text_lower:
        loc_prefs.append("Pune")
    if "delhi" in text_lower or "noida" in text_lower or "gurgaon" in text_lower:
        loc_prefs.append("Delhi NCR")
    if "mumbai" in text_lower:
        loc_prefs.append("Mumbai")
    if not loc_prefs:
        loc_prefs = ["India", "Remote"]

    work_mode = "Remote" if "remote" in text_lower else ("Hybrid" if "hybrid" in text_lower else "Flexible")

    profile_dict = {
        "target_roles": target_roles,
        "technical_skills": [_fmt_tech(s) for s in all_tech],
        "soft_skills": [s.title() for s in found_soft] or ["Problem Solving", "Teamwork", "Communication"],
        "programming_languages": [_fmt_tech(s) for s in found_langs],
        "frameworks": [_fmt_tech(s) for s in found_frameworks],
        "databases": [_fmt_tech(s) for s in found_dbs],
        "cloud_technologies": [_fmt_tech(s) for s in found_cloud],
        "tools": [_fmt_tech(s) for s in found_tools],
        "education": education_items,
        "degree": degree,
        "experience_level": exp_level,
        "years_of_experience": years_exp,
        "internship_experience": has_internship,
        "project_experience": has_projects,
        "certifications": [],
        "preferred_industries": ["Information Technology", "Software", "Fintech"],
        "location_preferences": loc_prefs,
        "work_mode_preference": work_mode,
    }

    # Search parameters recommendation
    search_keywords = profile_dict["programming_languages"][:2] + profile_dict["frameworks"][:2] + [target_roles[0]]
    profile_dict["search_params"] = {
        "keywords": search_keywords,
        "location": loc_prefs[0],
        "experience": f"0-{int(years_exp + 1)}" if years_exp <= 1 else f"{int(years_exp)}-{int(years_exp + 2)}",
        "remote": work_mode == "Remote",
    }

    return profile_dict


def _has_word(word: str, text: str) -> bool:
    escaped = re.escape(word).replace(r"\ ", r"\s+")
    return bool(re.search(r"(?<![\w+#.])" + escaped + r"(?![\w+#.])", text, re.I))
