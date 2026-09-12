"""Transparent deterministic ATS checks; these intentionally do not call an AI model."""
from __future__ import annotations

import re
from collections import Counter

SECTION_PATTERNS = {
    "summary": r"\b(professional\s+(summary|profile)|summary|objective|about\s+me)\b",
    "education": r"\b(education|academic\s+background|qualifications?)\b",
    "experience": r"\b(work\s+experience|professional\s+experience|employment\s+history|experience)\b",
    "skills": r"\b(technical\s+skills|skills|competencies|technologies)\b",
    "projects": r"\b(projects?|selected\s+projects?)\b",
    "certifications": r"\b(certifications?|licenses?)\b",
}
ACTION_VERBS = {"achieved", "built", "created", "delivered", "designed", "developed", "improved", "implemented", "increased", "led", "managed", "optimized", "reduced", "shipped", "streamlined"}
COMMON_KEYWORDS = {"python", "java", "javascript", "typescript", "react", "fastapi", "sql", "postgresql", "aws", "docker", "git", "api", "agile", "machine learning", "data analysis"}


def _contains(pattern: str, text: str) -> bool:
    return bool(re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE))


def score_resume(text: str) -> dict:
    normalized = re.sub(r"\s+", " ", text).strip()
    lower = normalized.lower()
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.-]*", lower)
    sections = {name: _contains(pattern, text) for name, pattern in SECTION_PATTERNS.items()}
    email = _contains(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", text)
    phone = _contains(r"(?<!\d)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,4}\)?[ .-]?)?\d{3,4}[ .-]\d{4}(?!\d)", text)
    # A candidate name is conservatively inferred only from a name-like first non-empty line.
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    name = bool(re.fullmatch(r"[A-Za-z][A-Za-z .'-]{1,80}", first_line)) and not _contains(r"resume|curriculum", first_line)
    quantified = bool(re.search(r"(?:\$|\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent|users|clients|hours|days|months|years)\b)", lower))
    action_verb_count = len(ACTION_VERBS.intersection(words))
    keyword_count = len([keyword for keyword in COMMON_KEYWORDS if keyword in lower])
    special_ratio = len(re.findall(r"[^\w\s@.+#&/()-]", text)) / max(len(text), 1)
    suspicious = special_ratio > 0.08 or bool(re.search(r"(.)\1{8,}", text))
    word_count = len(words)

    checks = {
        "contact_information": email or phone,
        "email": email,
        "phone": phone,
        "name": name,
        **sections,
        "quantifiable_achievements": quantified,
        "action_verbs": action_verb_count >= 3,
        "standard_headings": sum(sections.values()) >= 3,
        "appropriate_length": 180 <= word_count <= 1800,
        "keyword_presence": keyword_count >= 3,
        "suspicious_formatting": not suspicious,
    }
    # Each item maps directly to observable source text; weighting is kept here for auditability.
    weights = {
        "contact_information": 10, "summary": 8, "education": 10, "experience": 17,
        "skills": 15, "projects": 8, "certifications": 4, "quantifiable_achievements": 8,
        "action_verbs": 5, "standard_headings": 5, "appropriate_length": 5,
        "keyword_presence": 3, "suspicious_formatting": 2,
    }
    score = round(sum(weight for key, weight in weights.items() if checks[key]))
    issues, recommendations, missing = [], [], []
    for section in ("summary", "education", "experience", "skills", "projects"):
        if not checks[section]:
            missing.append(section)
            issues.append(f"Missing or unrecognised {section} section")
            recommendations.append(f"Add a clearly labelled {section} section using a standard heading.")
    if not checks["contact_information"]:
        issues.append("No email or phone number detected")
        recommendations.append("Add a professional email address and a contact phone number.")
    if not checks["quantifiable_achievements"]:
        issues.append("Few quantifiable achievements detected")
        recommendations.append("Add metrics such as percentages, scope, time saved, or outcomes to achievement bullets.")
    if not checks["appropriate_length"]:
        issues.append("Resume length appears unusually short or long")
    if suspicious:
        issues.append("Unusual special-character density may reduce ATS readability")
        recommendations.append("Use simple text, standard bullets, and conventional section headings.")
    return {"score": score, "checks": checks, "issues": issues, "recommendations": recommendations, "missing_sections": missing, "metrics": {"word_count": word_count, "action_verb_count": action_verb_count, "keyword_count": keyword_count}}
