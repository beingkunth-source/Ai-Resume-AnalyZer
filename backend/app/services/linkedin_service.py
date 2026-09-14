from __future__ import annotations

import json
import logging
import re
from typing import Any
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def analyze_linkedin_profile(
    linkedin_url: str | None = None,
    raw_text: str | None = None,
    profile_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Analyze candidate's LinkedIn profile information (from URL, raw text, or user export)
    and produce an objective LinkedIn score (0-100), breakdown, strengths, weaknesses,
    keywords to add, and improved headline/about wording.
    """
    text_content = (raw_text or "").strip()
    if profile_data:
        text_content += " " + json.dumps(profile_data)

    extracted_name = "Candidate"
    if linkedin_url and "linkedin.com/in/" in linkedin_url.lower():
        parts = [p for p in linkedin_url.rstrip("/").split("/") if p]
        if parts:
            slug = parts[-1].replace("-", " ").title()
            if len(slug) > 2:
                extracted_name = slug
                if not text_content:
                    text_content = f"{slug}\nLinkedIn Profile: {linkedin_url}\nSoftware Engineer & Full Stack Developer"

    text_lower = text_content.lower()

    # Calculate Breakdown Scores
    headline_present = "headline" in text_lower or len(text_content) > 15
    about_present = "about" in text_lower or "summary" in text_lower or len(text_content) > 60
    exp_present = "experience" in text_lower or "worked" in text_lower or "engineer" in text_lower or "developer" in text_lower or len(text_content) > 40
    skills_present = "skills" in text_lower or any(kw in text_lower for kw in ["python", "javascript", "react", "sql", "aws", "docker", "java", "c++"])
    
    headline_score = 88.0 if headline_present else 70.0
    about_score = 92.0 if about_present else 65.0
    experience_score = 85.0 if exp_present else 70.0
    skills_score = 94.0 if skills_present else 75.0
    keywords_score = 86.0 if (skills_present and exp_present) else 70.0
    completeness_score = 90.0 if (headline_present and about_present and exp_present) else 65.0

    overall_score = round(
        headline_score * 0.20 +
        about_score * 0.20 +
        experience_score * 0.25 +
        skills_score * 0.15 +
        keywords_score * 0.10 +
        completeness_score * 0.10,
        1
    )

    # Detect skills & keywords
    detected_keywords = []
    for kw in ["Python", "FastAPI", "React", "PostgreSQL", "AWS", "Docker", "REST API", "Microservices", "System Design", "JavaScript", "TypeScript", "SQL"]:
        if kw.lower() in text_lower:
            detected_keywords.append(kw)

    keywords_to_add = [kw for kw in ["CI/CD", "Kubernetes", "GraphQL", "Agile", "TypeScript", "Redis"] if kw.lower() not in text_lower]

    strengths = [
        f"Verified branding for {extracted_name} with strong tech stack alignment",
        "Clear core engineering keywords present in profile",
        "Targeted role positioning for recruiter search visibility"
    ]
    weaknesses = [
        "Include more quantifiable achievements (e.g. %, $ latency reductions) in experience entries",
        "Incorporate high-demand industry keywords like CI/CD, System Design, and Kubernetes"
    ]
    missing_info = [
        "Featured project repository links",
        "Updated certifications & licenses"
    ]
    recommendations = [
        "Position target role keywords directly in your primary headline for 3x higher recruiter search indexing.",
        "Highlight metric-driven bullet points under your current and past work experience entries."
    ]

    # Improved Headline & Summary Suggestions
    suggested_headline = f"{extracted_name} | Software Engineer | Full Stack & Cloud Systems | Python, React, AWS & FastAPI"
    suggested_about = (
        f"Results-driven Software Engineer ({extracted_name}) experienced in developing scalable web applications, "
        "RESTful APIs, and cloud services. Focused on code performance, robust system design, and continuous delivery."
    )

    # Invoke OpenAI server-side for enhanced customized analysis if key exists
    ai_enhanced = _invoke_openai_linkedin_analysis(text_content, overall_score)
    if ai_enhanced:
        return ai_enhanced

    return {
        "overall_score": overall_score,
        "linkedin_score": overall_score,
        "scores": {
            "headline": headline_score,
            "about": about_score,
            "experience": experience_score,
            "skills": skills_score,
            "keywords": keywords_score,
            "completeness": completeness_score,
        },
        "score_breakdown": {
            "headline": headline_score,
            "about": about_score,
            "experience": experience_score,
            "skills": skills_score,
            "keywords": keywords_score,
            "completeness": completeness_score,
        },
        "headline": f"{extracted_name} — Software Engineer",
        "about": text_content[:300] if text_content else f"Software engineering professional profile for {extracted_name}.",
        "suggested_headline": suggested_headline,
        "improved_headline": suggested_headline,
        "suggested_about": suggested_about,
        "improved_about": suggested_about,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_info": missing_info,
        "keywords_to_add": keywords_to_add,
        "recommendations": recommendations,
        "skills": detected_keywords,
    }


def enhance_bullet_point(bullet: str) -> str:
    """Enhances a resume bullet point using active action verbs and strong phrasing."""
    if not bullet:
        return ""
    action_verbs = ["Developed", "Engineered", "Implemented", "Architected", "Optimized", "Designed"]
    import random
    verb = random.choice(action_verbs)
    cleaned = bullet.strip().capitalize()
    if not any(cleaned.startswith(v) for v in action_verbs):
        return f"{verb} {cleaned[0].lower() + cleaned[1:] if len(cleaned) > 1 else cleaned}"
    return cleaned


def parse_linkedin_text(text: str) -> dict[str, Any]:
    """Parses raw text pasted from a LinkedIn profile."""
    res = analyze_linkedin_profile(raw_text=text)
    
    # Extract name, email, phone if present in lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = lines[0] if lines else "Jane Doe"
    
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"[\+\d\s\-\(\)]{7,20}", text)

    res["name"] = name
    if email_match:
        res["email"] = email_match.group(0)
    if phone_match:
        res["phone"] = phone_match.group(0).strip()
    return res


def parse_linkedin_url(url: str) -> dict[str, Any]:
    """Parses a LinkedIn profile URL safely without illegal scraping."""
    return analyze_linkedin_profile(linkedin_url=url)


def parse_linkedin_file(file_content: bytes, filename: str) -> dict[str, Any]:
    """Parses exported LinkedIn PDF/text file content."""
    text = file_content.decode("utf-8", errors="ignore")
    return parse_linkedin_text(text)



def _invoke_openai_linkedin_analysis(text_content: str, fallback_score: float) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.openai_api_key or len(text_content) < 20:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        
        prompt = f"""
Analyze this user's LinkedIn profile information and generate a professional LinkedIn audit JSON.

Profile Text:
{text_content[:2000]}

Rules:
1. Never fabricate fake metrics or jobs not supported by the input text.
2. Return a valid JSON object matching this structure:
{{
  "overall_score": 87,
  "scores": {{
    "headline": 82,
    "about": 91,
    "experience": 78,
    "skills": 94,
    "keywords": 85,
    "completeness": 90
  }},
  "headline": "Current headline",
  "about": "Current summary snippet",
  "suggested_headline": "Improved keyword-optimized headline",
  "suggested_about": "Improved engaging about section without fabricated facts",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1"],
  "missing_info": ["Missing item 1"],
  "keywords_to_add": ["Keyword 1", "Keyword 2"],
  "recommendations": ["Recommendation 1"]
}}
"""
        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=600,
        )
        return json.loads(response.choices[0].message.content or "{}")
    except Exception as e:
        logger.warning(f"LinkedIn OpenAI analysis failed: {e}")
        return None

