"""Transparent deterministic ATS checks; these intentionally do not call an AI model."""
from __future__ import annotations

import re

SECTION_PATTERNS = {
    "summary": r"\b(professional\s+(summary|profile)|executive\s+summary|career\s+(overview|objective)|personal\s+statement|summary|objective|about\s+me|profile)\b",
    "education": r"\b(education(al)?(\s+(qualifications|background|history))?|academic\s+(background|qualifications|history)|qualifications?|academics)\b",
    "experience": r"\b((work|professional|employment|career|relevant)\s+experience|employment\s+history|work\s+history|career\s+history|professional\s+background|experience|internships?)\b",
    "skills": r"\b((technical|key|core)\s+(skills|competencies|proficiencies|expertise)|skills|competencies|technologies|technical\s+expertise|areas\s+of\s+expertise|tools\s+(&|and)\s+technologies|tech\s+stack|proficiencies)\b",
    "projects": r"\b((selected|key|personal|academic|featured|notable|practical)\s+projects?|projects?)\b",
    "certifications": r"\b((professional\s+)?certifications?|licenses?|certificates?|certifications?\s+(&|and)\s+(licenses?|training))\b",
}

ACTION_VERBS = {
    "accelerated", "achieved", "administered", "analyzed", "architected", "automated",
    "built", "calculated", "collaborated", "conducted", "configured", "constructed",
    "coordinated", "created", "debugged", "delivered", "deployed", "designed",
    "developed", "directed", "drove", "engineered", "established", "evaluated",
    "executed", "expanded", "formulated", "guided", "implemented", "improved",
    "increased", "initiated", "integrated", "launched", "led", "maintained",
    "managed", "mentored", "migrated", "modernized", "optimized", "orchestrated",
    "organized", "pioneered", "produced", "reduced", "refactored", "resolved",
    "restructured", "revamped", "scaled", "shipped", "simplified", "solved",
    "spearheaded", "standardized", "streamlined", "structured", "supervised",
    "supported", "tested", "transformed", "upgraded", "utilized", "validated"
}

COMMON_KEYWORDS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang", "rust",
    "ruby", "php", "swift", "kotlin", "html", "css", "sql", "mysql", "postgresql",
    "postgres", "mongodb", "redis", "elasticsearch", "dynamodb", "aws", "azure", "gcp",
    "docker", "kubernetes", "k8s", "ci/cd", "jenkins", "github actions", "terraform",
    "ansible", "linux", "git", "api", "apis", "rest", "graphql", "react", "next.js",
    "vue", "angular", "node", "nodejs", "express", "fastapi", "django", "flask",
    "spring", "dotnet", ".net", "redux", "tailwind", "pandas", "numpy", "pytorch",
    "tensorflow", "scikit-learn", "agile", "scrum", "jira", "unit testing",
    "system design", "microservices", "oop", "frontend", "backend", "fullstack",
    "full stack", "devops", "qa", "cybersecurity", "machine learning", "data analysis",
    "data science", "cloud computing"
}


def _contains(pattern: str, text: str) -> bool:
    return bool(re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE))


def score_resume(text: str) -> dict:
    normalized = re.sub(r"\s+", " ", text).strip()
    lower = normalized.lower()
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.-]*", lower)
    word_set = set(words)
    sections = {name: _contains(pattern, text) for name, pattern in SECTION_PATTERNS.items()}

    email = _contains(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text)
    # Support international (+91, +1), parenthesized, hyphenated, dotted, and raw 10-12 digit numbers
    phone = _contains(r"(?:\+\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}", text)

    # Check for candidate name in the first few non-empty lines
    non_empty_lines = [line.strip() for line in text.splitlines() if line.strip()][:5]
    name = any(
        bool(re.fullmatch(r"[A-Za-z][A-Za-z .'-]{1,80}", line))
        and not re.search(r"\b(resume|curriculum|cv|page|email|phone|contact|summary|skills|experience)\b", line, re.IGNORECASE)
        for line in non_empty_lines
    )

    quantified = bool(re.search(
        r"(\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent|x|k|m|b|\+|\$|users|clients|customers|hours|days|weeks|months|years|fps|ms|tps)\b"
        r"|(?:\$|€|£|₹)\s*\d+(?:\.\d+)?\s*(?:k|m|b|million|billion|thousand)?"
        r"|\b\d+\s*\+\s*(?:years|projects|users|clients|team|developers)\b"
        r"|\b(?:increased|reduced|improved|boosted|grew|saved|cut|decreased)\b.{1,40}\b\d+)",
        lower
    ))

    action_verb_count = len(ACTION_VERBS.intersection(word_set))
    keyword_count = len([kw for kw in COMMON_KEYWORDS if kw in lower or kw in word_set])
    special_ratio = len(re.findall(r"[^\w\s@.+#&/()-]", text)) / max(len(text), 1)
    suspicious = special_ratio > 0.08 or bool(re.search(r"(.)\1{8,}", text))
    word_count = len(words)

    has_projects_or_certs = sections["projects"] or sections["certifications"]

    checks = {
        "contact_information": email or phone,
        "email": email,
        "phone": phone,
        "name": name,
        **sections,
        "quantifiable_achievements": quantified,
        "action_verbs": action_verb_count >= 3,
        "standard_headings": sum(sections.values()) >= 3,
        "appropriate_length": 120 <= word_count <= 2500,
        "keyword_presence": keyword_count >= 3,
        "suspicious_formatting": not suspicious,
    }

    # Weight distribution summing to 100 points
    weights = {
        "contact_information": 10,
        "summary": 10,
        "education": 12,
        "experience": 18,
        "skills": 15,
        "quantifiable_achievements": 10,
        "action_verbs": 10,
        "standard_headings": 5,
        "appropriate_length": 5,
        "keyword_presence": 5,
    }

    score = sum(weight for key, weight in weights.items() if checks.get(key, False))
    # Give up to 10 points for projects or certifications section
    if has_projects_or_certs:
        score += 10
    else:
        # If both projects & certs are omitted but experience is strong (>= 3 action verbs & achievements), don't penalize severely
        if checks["experience"] and checks["action_verbs"]:
            score += 5

    score = min(100, round(score))

    issues, recommendations, missing = [], [], []
    for section in ("summary", "education", "experience", "skills"):
        if not checks[section]:
            missing.append(section)
            issues.append(f"Missing or unrecognised {section} section")
            recommendations.append(f"Add a clearly labelled {section} section using a standard heading.")

    if not checks["projects"] and not checks["certifications"]:
        issues.append("Neither Projects nor Certifications section detected")
        recommendations.append("Consider adding a Projects or Certifications section to demonstrate practical experience.")

    if not checks["contact_information"]:
        issues.append("No email or phone number detected")
        recommendations.append("Add a professional email address and contact phone number near the top of your resume.")
    elif not email:
        issues.append("Email address missing")
        recommendations.append("Include a valid email address.")
    elif not phone:
        issues.append("Phone number missing")
        recommendations.append("Include a valid contact phone number.")

    if not checks["quantifiable_achievements"]:
        issues.append("Few quantifiable achievements detected")
        recommendations.append("Add metrics such as percentages, time saved, revenue, or team size to achievement bullet points.")

    if not checks["action_verbs"]:
        issues.append("Low count of strong action verbs")
        recommendations.append("Start bullet points with strong action verbs (e.g. Engineered, Architected, Automated, Spearheaded).")

    if not checks["appropriate_length"]:
        issues.append(f"Resume word count ({word_count} words) is outside ideal range (120 - 2500 words)")
        recommendations.append("Adjust length to ideally fit 1-2 formatted pages.")

    if suspicious:
        issues.append("Unusual special-character density or repeated symbols detected")
        recommendations.append("Avoid complex graphics, unusual bullet symbols, or copy-pasted icon characters.")

    return {
        "score": score,
        "checks": checks,
        "issues": issues,
        "recommendations": recommendations,
        "missing_sections": missing,
        "metrics": {
            "word_count": word_count,
            "action_verb_count": action_verb_count,
            "keyword_count": keyword_count,
        },
    }

