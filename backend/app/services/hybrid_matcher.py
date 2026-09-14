from __future__ import annotations

import json
import logging
import re
from typing import Any
from app.core.config import get_settings
from app.services.embedding_service import semantic_similarity
from app.services.candidate_profile_service import extract_candidate_profile, PROGRAMMING_LANGS, FRAMEWORKS, DATABASES, CLOUD_TECH, TOOLS

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "about", "after", "again", "all", "also", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before",
    "being", "between", "both", "but", "by", "can", "duties", "each", "experience", "for", "from", "has", "have", "having",
    "how", "if", "in", "into", "is", "it", "its", "job", "more", "must", "not", "of", "on", "only", "or", "other", "our",
    "out", "over", "preferred", "required", "role", "should", "skills", "so", "some", "strong", "such", "team", "than",
    "that", "the", "their", "them", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "using", "very", "was", "we", "well", "were", "what", "when", "where", "which", "while", "who", "will",
    "with", "work", "would", "year", "years", "you", "your", "ability", "development", "building", "working"
}

ALL_TAXONOMY_SKILLS = PROGRAMMING_LANGS | FRAMEWORKS | DATABASES | CLOUD_TECH | TOOLS


def calculate_hybrid_job_match(
    resume_text: str,
    job: dict[str, Any],
    candidate_profile: dict[str, Any] | None = None,
    generate_ai_explanation: bool = False,
) -> dict[str, Any]:
    """
    Calculate a hybrid match score between candidate resume and normalized job.
    Formula Weights:
      - Skill Match: 35%
      - Semantic Similarity: 25%
      - Keyword Match: 15%
      - Experience Match: 10%
      - Education Match: 5%
      - Job Role Match: 10%
    """
    if candidate_profile is None:
        candidate_profile = extract_candidate_profile(resume_text)

    job_title = job.get("title", "")
    job_desc = job.get("description", "")
    job_text_norm = " " + re.sub(r"\s+", " ", (job_title + " " + job_desc).lower()) + " "
    resume_norm = " " + re.sub(r"\s+", " ", resume_text.lower()) + " "

    # 1. Skill Match (35%)
    job_given_skills = [s.lower() for s in job.get("skills", [])]
    job_detected_skills = [s for s in ALL_TAXONOMY_SKILLS if _present(s, job_text_norm)]
    all_job_skills = list(set(job_given_skills + job_detected_skills))

    cand_skills = [s.lower() for s in candidate_profile.get("technical_skills", [])]
    matched_skills = [s for s in all_job_skills if s in cand_skills or _present(s, resume_norm)]
    missing_skills = [s for s in all_job_skills if s not in matched_skills]

    skill_score = (len(matched_skills) / max(1, len(all_job_skills))) * 100 if all_job_skills else 80.0

    # 2. Semantic Similarity (25%)
    try:
        sem_sim = semantic_similarity(resume_text, job_desc)
        semantic_score = sem_sim * 100
    except Exception:
        sem_sim = None
        semantic_score = skill_score

    # 3. Keyword Match (15%)
    job_words = _extract_keywords(job_desc)
    resume_words = _extract_keywords(resume_text)
    matched_keywords = sorted(list(job_words.intersection(resume_words)))[:30]
    missing_keywords = sorted(list(job_words.difference(resume_words)))[:30]
    keyword_score = (len(matched_keywords) / max(1, min(len(job_words), 30))) * 100

    # 4. Experience Match (10%)
    req_exp_str = job.get("experience_required", "") or ""
    req_exp_years = [int(v) for v in re.findall(r"\b(\d{1,2})\b", req_exp_str)]
    min_req_exp = req_exp_years[0] if req_exp_years else 0
    cand_exp = candidate_profile.get("years_of_experience", 0.0)

    if min_req_exp == 0 or cand_exp >= min_req_exp:
        experience_score = 100.0
    elif cand_exp >= min_req_exp - 1:
        experience_score = 80.0
    else:
        experience_score = 50.0

    # 5. Education Match (5%)
    cand_degree = (candidate_profile.get("degree") or "").lower()
    if "master" in job_text_norm or "phd" in job_text_norm:
        education_score = 100.0 if ("master" in cand_degree or "phd" in cand_degree) else 75.0
    else:
        education_score = 100.0 if cand_degree else 70.0

    # 6. Job Role Match (10%)
    target_roles = [r.lower() for r in candidate_profile.get("target_roles", [])]
    job_title_norm = job_title.lower()
    role_score = 60.0
    for role in target_roles:
        if role in job_title_norm or any(part in job_title_norm for part in role.split() if len(part) > 3):
            role_score = 100.0
            break

    # Calculate Weighted Final Score
    final_score = (
        skill_score * 0.35 +
        semantic_score * 0.25 +
        keyword_score * 0.15 +
        experience_score * 0.10 +
        education_score * 0.05 +
        role_score * 0.10
    )
    final_score = min(100.0, max(0.0, round(final_score, 1)))

    # Determine Recommendation Category
    if final_score >= 85:
        category = "BEST MATCHES"
    elif final_score >= 70:
        category = "GOOD MATCHES"
    elif final_score >= 50:
        category = "POTENTIAL MATCHES"
    else:
        category = "LOW MATCH"

    # AI Rationale Explanation Generation
    explanation = None
    if generate_ai_explanation:
        explanation = _generate_ai_explanation(
            resume_text=resume_text,
            job=job,
            final_score=final_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            cand_profile=candidate_profile
        )

    if not explanation:
        # Fallback deterministic structured explanation
        strengths = [f"Strong match for {s.capitalize()}" for s in matched_skills[:5]]
        gaps = [f"Missing experience in {s.capitalize()}" for s in missing_skills[:4]]
        reason = f"Candidate matches {len(matched_skills)} core technical skills required for {job_title}."
        rec = "Strongly Apply" if final_score >= 85 else ("Consider Applying" if final_score >= 70 else "Review Requirements")
        explanation = {
            "match_score": final_score,
            "reason": reason,
            "matched_skills": [s.capitalize() for s in matched_skills[:10]],
            "missing_skills": [s.capitalize() for s in missing_skills[:10]],
            "strengths": strengths or ["Relevant technical background"],
            "gaps": gaps or ["No major skill gaps detected"],
            "recommendation": rec,
            "sub_scores": {
                "skill": round(skill_score, 1),
                "semantic": round(semantic_score, 1),
                "keyword": round(keyword_score, 1),
                "experience": round(experience_score, 1),
                "education": round(education_score, 1),
                "role": round(role_score, 1),
            }
        }

    return {
        "job": job,
        "match_score": final_score,
        "category": category,
        "matched_skills": [s.capitalize() for s in matched_skills],
        "missing_skills": [s.capitalize() for s in missing_skills],
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "explanation": explanation
    }


def _generate_ai_explanation(
    resume_text: str,
    job: dict[str, Any],
    final_score: float,
    matched_skills: list[str],
    missing_skills: list[str],
    cand_profile: dict[str, Any],
) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        
        prompt = f"""
Analyze this candidate resume against the normalized job description and output JSON match rationale.

Resume Summary:
- Target Roles: {cand_profile.get('target_roles')}
- Degree: {cand_profile.get('degree')} ({cand_profile.get('experience_level')})
- Technical Skills: {cand_profile.get('technical_skills')[:12]}

Job Title: {job.get('title')}
Company: {job.get('company')}
Job Requirements: {job.get('skills')}
Job Description Snippet: {job.get('description')[:500]}

Calculated Match Score: {final_score}%

Return ONLY a JSON object with this exact structure:
{{
  "match_score": {final_score},
  "reason": "Clear concise 1-sentence explanation of role fit",
  "matched_skills": ["Skill1", "Skill2"],
  "missing_skills": ["Skill3"],
  "strengths": ["Bullet point strength 1", "Bullet point strength 2"],
  "gaps": ["Bullet point gap 1"],
  "recommendation": "Strongly Apply"
}}
"""
        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=350,
        )
        data = json.loads(response.choices[0].message.content or "{}")
        data["match_score"] = final_score
        return data
    except Exception as e:
        logger.warning(f"Could not generate AI match explanation via OpenAI: {e}")
        return None


def _present(term: str, text: str) -> bool:
    escaped = re.escape(term).replace(r"\ ", r"\s+")
    return bool(re.search(r"(?<![\w+#.])" + escaped + r"(?![\w+#.])", text, re.I))


def _extract_keywords(text: str) -> set[str]:
    raw_words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#.-]{1,25}\b", text)
    cleaned = set()
    for w in raw_words:
        w_clean = w.strip(".-,").lower()
        if len(w_clean) >= 3 and w_clean not in STOP_WORDS and not w_clean.isdigit():
            cleaned.add(w_clean)
    return cleaned
