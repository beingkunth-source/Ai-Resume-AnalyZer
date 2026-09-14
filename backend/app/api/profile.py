from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Profile, Resume, LinkedInProfile, GitHubProfile, User
from app.schemas.profile import ProfileCreateOrUpdate, ProfileOut
from app.services.profile_service import calculate_profile_completion, build_unified_career_profile
from app.utils.helpers import success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", summary="Get current candidate profile")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    has_resumes = bool(db.scalar(select(Resume).where(Resume.user_id == current_user.id)))
    has_linkedin = bool(db.scalar(select(LinkedInProfile).where(LinkedInProfile.user_id == current_user.id)))
    has_github = bool(db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == current_user.id)))

    if not profile:
        # Create default initial profile from user registration details
        name_parts = current_user.name.split()
        first_name = name_parts[0] if name_parts else "Candidate"
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        profile = Profile(
            user_id=current_user.id,
            first_name=first_name,
            last_name=last_name,
            headline="",
            target_roles=[],
        )
        try:
            db.add(profile)
            db.commit()
            db.refresh(profile)
        except Exception:
            db.rollback()
            profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))


    comp_percentage = calculate_profile_completion(profile, has_resumes, has_linkedin, has_github)
    out = ProfileOut.model_validate(profile).model_dump(mode="json")
    out["completion_percentage"] = comp_percentage
    return success(out)


@router.put("", summary="Update candidate profile")
def update_profile(
    payload: ProfileCreateOrUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    if not profile:
        profile = Profile(user_id=current_user.id, first_name=payload.first_name, last_name=payload.last_name)
        db.add(profile)

    profile.first_name = payload.first_name
    profile.last_name = payload.last_name
    if payload.headline is not None:
        profile.headline = payload.headline
    if payload.location is not None:
        profile.location = payload.location
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.portfolio_url is not None:
        profile.portfolio_url = payload.portfolio_url
    if payload.website_url is not None:
        profile.website_url = payload.website_url
    if payload.linkedin_url is not None:
        profile.linkedin_url = payload.linkedin_url
    if payload.github_url is not None:
        profile.github_url = payload.github_url
    if payload.current_status:
        profile.current_status = payload.current_status
    if payload.user_goals:
        profile.user_goals = payload.user_goals
    if payload.target_roles:
        profile.target_roles = payload.target_roles
    if payload.work_mode:
        profile.work_mode = payload.work_mode
    if payload.location_preferences:
        profile.location_preferences = payload.location_preferences

    profile.has_existing_resume = payload.has_existing_resume
    profile.has_completed_onboarding = payload.has_completed_onboarding
    if payload.profile_json:
        profile.profile_json = payload.profile_json

    db.commit()
    db.refresh(profile)

    has_resumes = bool(db.scalar(select(Resume).where(Resume.user_id == current_user.id)))
    has_linkedin = bool(db.scalar(select(LinkedInProfile).where(LinkedInProfile.user_id == current_user.id)))
    has_github = bool(db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == current_user.id)))

    comp_percentage = calculate_profile_completion(profile, has_resumes, has_linkedin, has_github)
    out = ProfileOut.model_validate(profile).model_dump(mode="json")
    out["completion_percentage"] = comp_percentage
    return success(out)


@router.get("/completion", summary="Get candidate profile completion score")
def get_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    has_resumes = bool(db.scalar(select(Resume).where(Resume.user_id == current_user.id)))
    has_linkedin = bool(db.scalar(select(LinkedInProfile).where(LinkedInProfile.user_id == current_user.id)))
    has_github = bool(db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == current_user.id)))

    comp_percentage = calculate_profile_completion(profile, has_resumes, has_linkedin, has_github)
    return success({
        "completion_percentage": comp_percentage,
        "has_onboarding": profile.has_completed_onboarding if profile else False,
        "has_resume": has_resumes,
        "has_linkedin": has_linkedin or bool(profile and profile.linkedin_url),
        "has_github": has_github or bool(profile and profile.github_url),
    })


@router.get("/unified", summary="Get Unified AI Professional Profile")
def get_unified_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unified = build_unified_career_profile(current_user, db)
    return success(unified)
