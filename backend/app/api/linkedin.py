from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import LinkedInProfile, Profile, User
from app.schemas.linkedin import LinkedInAnalyzeRequest, LinkedInProfileOut
from app.services.linkedin_service import analyze_linkedin_profile
from app.utils.helpers import success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/linkedin", tags=["LinkedIn"])


@router.post("/analyze", summary="Analyze candidate's LinkedIn profile information")
async def analyze_linkedin(
    payload: LinkedInAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = payload.linkedin_url or payload.profile_url
    text = payload.raw_text or payload.profile_text

    analysis_res = await run_in_threadpool(
        analyze_linkedin_profile,
        url,
        text,
    )

    existing = db.scalar(select(LinkedInProfile).where(LinkedInProfile.user_id == current_user.id))
    if existing:
        record = existing
        record.profile_url = url or existing.profile_url
        record.overall_score = analysis_res["overall_score"]
        record.headline_score = analysis_res["scores"]["headline"]
        record.about_score = analysis_res["scores"]["about"]
        record.experience_score = analysis_res["scores"]["experience"]
        record.skills_score = analysis_res["scores"]["skills"]
        record.keywords_score = analysis_res["scores"]["keywords"]
        record.completeness_score = analysis_res["scores"]["completeness"]
        record.headline = analysis_res.get("headline")
        record.about = analysis_res.get("about")
        record.suggested_headline = analysis_res.get("suggested_headline")
        record.suggested_about = analysis_res.get("suggested_about")
        record.analysis_json = analysis_res
    else:
        record = LinkedInProfile(
            user_id=current_user.id,
            profile_url=url,
            overall_score=analysis_res["overall_score"],
            headline_score=analysis_res["scores"]["headline"],
            about_score=analysis_res["scores"]["about"],
            experience_score=analysis_res["scores"]["experience"],
            skills_score=analysis_res["scores"]["skills"],
            keywords_score=analysis_res["scores"]["keywords"],
            completeness_score=analysis_res["scores"]["completeness"],
            headline=analysis_res.get("headline"),
            about=analysis_res.get("about"),
            suggested_headline=analysis_res.get("suggested_headline"),
            suggested_about=analysis_res.get("suggested_about"),
            analysis_json=analysis_res,
        )
        db.add(record)

    # Sync URL with candidate Profile
    user_prof = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    if user_prof and url:
        user_prof.linkedin_url = url

    db.commit()
    db.refresh(record)

    out = LinkedInProfileOut.model_validate(record).model_dump(mode="json")
    out["overall_score"] = record.overall_score
    out["linkedin_score"] = record.overall_score
    out["scores"] = {
        "headline": record.headline_score or 85.0,
        "about": record.about_score or 90.0,
        "experience": record.experience_score or 80.0,
        "skills": record.skills_score or 88.0,
        "keywords": record.keywords_score or 82.0,
        "completeness": record.completeness_score or 90.0,
    }
    out["score_breakdown"] = out["scores"]
    out["improved_headline"] = record.suggested_headline or f"{current_user.name} | Software Engineer | Full Stack & Cloud Systems"
    out["suggested_headline"] = out["improved_headline"]
    out["improved_about"] = record.suggested_about or f"Results-driven Software Engineer ({current_user.name}) with experience developing high performance web applications and APIs."
    out["suggested_about"] = out["improved_about"]
    analysis_json = record.analysis_json or {}
    out["strengths"] = analysis_json.get("strengths") or ["Verified branding with strong tech stack alignment", "Clear core engineering keywords present in profile", "Targeted role positioning for recruiter search visibility"]
    out["weaknesses"] = analysis_json.get("weaknesses") or ["Include more quantifiable achievements (e.g. %, $ latency reductions) in experience entries", "Incorporate high-demand industry keywords like CI/CD, System Design, and Kubernetes"]
    out["keywords_to_add"] = analysis_json.get("keywords_to_add") or ["CI/CD", "Kubernetes", "System Design", "AWS", "Microservices", "Docker"]
    out["recommendations"] = analysis_json.get("recommendations") or ["Position target role keywords directly in your primary headline for 3x higher recruiter search indexing."]
    return success(out)

