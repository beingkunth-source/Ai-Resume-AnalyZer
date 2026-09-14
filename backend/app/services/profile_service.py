from __future__ import annotations

import logging
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.models import Profile, Resume, LinkedInProfile, GitHubProfile, User

logger = logging.getLogger(__name__)


def calculate_profile_completion(
    profile: Profile | None,
    has_resumes: bool,
    has_linkedin: bool,
    has_github: bool,
) -> float:
    """Calculate profile completion percentage from 0-100%."""
    score = 0.0
    if not profile:
        return 0.0

    # 1. Personal Info (20%)
    if profile.first_name and profile.last_name:
        score += 10.0
    if profile.headline and profile.location:
        score += 10.0

    # 2. Status, Goals & Target Roles (20%)
    if profile.target_roles and len(profile.target_roles) > 0:
        score += 10.0
    if profile.user_goals and len(profile.user_goals) > 0:
        score += 10.0

    # 3. Existing Resume (20%)
    if has_resumes or profile.has_existing_resume:
        score += 20.0

    # 4. Connected Profiles (20%)
    if has_linkedin or profile.linkedin_url:
        score += 10.0
    if has_github or profile.github_url:
        score += 10.0

    # 5. Profile Details & Projects (20%)
    p_json = profile.profile_json or {}
    if p_json.get("skills") or p_json.get("technical_skills"):
        score += 10.0
    if p_json.get("experience") or p_json.get("education") or p_json.get("projects"):
        score += 10.0

    return min(100.0, score)


def build_unified_career_profile(user: User, db: Session) -> dict[str, Any]:
    """
    Combine Resume + LinkedIn + GitHub + User Onboarding Inputs into a unified AI Career Profile.
    """
    profile_db = db.scalar(select(Profile).where(Profile.user_id == user.id))
    resume_db = db.scalar(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()))
    linkedin_db = db.scalar(select(LinkedInProfile).where(LinkedInProfile.user_id == user.id))
    github_db = db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == user.id))

    # Personal info
    first_name = profile_db.first_name if profile_db else user.name.split()[0]
    last_name = profile_db.last_name if profile_db else (" ".join(user.name.split()[1:]) or "")
    full_name = f"{first_name} {last_name}".strip()

    headline = (profile_db.headline if profile_db and profile_db.headline else None) or (linkedin_db.headline if linkedin_db else None) or "Software Development Professional"
    location = profile_db.location if profile_db and profile_db.location else "India"

    # Aggregated Skills
    skills_set = set()
    if profile_db and profile_db.profile_json:
        skills_set.update(profile_db.profile_json.get("skills", []))
        skills_set.update(profile_db.profile_json.get("technical_skills", []))

    if github_db:
        skills_set.update(github_db.top_languages or [])
        skills_set.update(github_db.top_technologies or [])

    if linkedin_db and linkedin_db.analysis_json:
        skills_set.update(linkedin_db.analysis_json.get("skills", []))

    # Aggregated Projects
    projects_list = []
    if github_db:
        for proj in github_db.projects:
            projects_list.append({
                "title": proj.repo_name,
                "url": proj.repo_url,
                "description": proj.generated_resume_bullet or proj.description or f"Open-source repository built in {proj.language or 'tech'}.",
                "technologies": [proj.language] + (proj.topics or []) if proj.language else proj.topics or [],
                "source": "GitHub"
            })

    # Aggregated Experience & Education
    experience_list = []
    education_list = []
    if resume_db and resume_db.analyses:
        latest_analysis = resume_db.analyses[0].analysis_json or {}
        extracted_info = latest_analysis.get("candidate_information", {})
        skills_set.update(latest_analysis.get("technical_skills", []))
        experience_list.extend(latest_analysis.get("experience", []))
        education_list.extend(latest_analysis.get("education", []))
        if not projects_list and latest_analysis.get("projects"):
            projects_list.extend(latest_analysis.get("projects", []))

    target_roles = profile_db.target_roles if profile_db and profile_db.target_roles else ["Software Engineer"]

    unified_profile = {
        "user_id": user.id,
        "name": full_name,
        "email": user.email,
        "headline": headline,
        "location": location,
        "phone": profile_db.phone if profile_db else None,
        "portfolio_url": profile_db.portfolio_url if profile_db else None,
        "linkedin_url": profile_db.linkedin_url if profile_db else None,
        "github_url": profile_db.github_url if profile_db else None,
        "current_status": profile_db.current_status if profile_db else "Working Professional",
        "target_roles": target_roles,
        "skills": sorted(list(skills_set)),
        "experience": experience_list,
        "education": education_list or [{"degree": "Bachelor's Degree", "field": "Computer Science"}],
        "projects": projects_list,
        "certifications": [],
        "github_projects": [p for p in projects_list if p.get("source") == "GitHub"],
        "linkedin_information": {
            "score": linkedin_db.overall_score if linkedin_db else None,
            "headline": linkedin_db.headline if linkedin_db else None,
            "about": linkedin_db.about if linkedin_db else None,
        } if linkedin_db else None,
        "career_level": "Entry Level" if profile_db and profile_db.current_status in ["Student", "Fresher", "Intern"] else "Mid Level",
        "location_preferences": profile_db.location_preferences if profile_db else ["Remote", "Flexible"],
        "job_preferences": {
            "work_mode": profile_db.work_mode if profile_db else "Any"
        }
    }

    return unified_profile
