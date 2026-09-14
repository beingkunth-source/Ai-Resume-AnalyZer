from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import GitHubProfile, GitHubProject, Profile, User
from app.schemas.github import GitHubAnalyzeRequest, GitHubProfileOut, GitHubProjectImportRequest
from app.services.github_analyzer import analyze_github_profile
from app.utils.helpers import success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/github", tags=["GitHub"])


@router.post("/analyze", summary="Analyze candidate's GitHub profile and repositories")
async def analyze_github(
    payload: GitHubAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        analysis_res = await run_in_threadpool(analyze_github_profile, payload.username_or_url)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Could not analyze GitHub profile: {err}")

    existing = db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == current_user.id))
    if existing:
        record = existing
        record.username = analysis_res["username"]
        record.profile_url = analysis_res["profile_url"]
        record.overall_score = analysis_res["overall_score"]
        record.top_languages = analysis_res["top_languages"]
        record.top_technologies = analysis_res["top_technologies"]
        record.analysis_json = analysis_res
        
        # Clear existing projects before re-adding
        db.query(GitHubProject).filter(GitHubProject.github_profile_id == record.id).delete()
    else:
        record = GitHubProfile(
            user_id=current_user.id,
            username=analysis_res["username"],
            profile_url=analysis_res["profile_url"],
            overall_score=analysis_res["overall_score"],
            top_languages=analysis_res["top_languages"],
            top_technologies=analysis_res["top_technologies"],
            analysis_json=analysis_res,
        )
        db.add(record)
        db.flush()

    # Sync projects
    for proj in analysis_res.get("projects", []):
        gp = GitHubProject(
            github_profile_id=record.id,
            repo_name=proj["repo_name"],
            repo_url=proj["repo_url"],
            description=proj.get("description"),
            language=proj.get("language"),
            stars_count=proj.get("stars_count", 0),
            topics=proj.get("topics", []),
            generated_resume_bullet=proj.get("generated_resume_bullet"),
            is_selected_for_resume=proj.get("is_selected_for_resume", False),
        )
        db.add(gp)

    # Sync URL with candidate Profile
    user_prof = db.scalar(select(Profile).where(Profile.user_id == current_user.id))
    if user_prof and analysis_res["profile_url"]:
        user_prof.github_url = analysis_res["profile_url"]

    db.commit()
    db.refresh(record)

    out = GitHubProfileOut.model_validate(record).model_dump(mode="json")
    out["github_score"] = record.overall_score
    out["github_username"] = record.username
    out["stars_received"] = sum(p.stars_count for p in record.projects)
    out["public_repos"] = len(record.projects)
    out["repositories"] = [
        {
            "id": p.id,
            "name": p.repo_name,
            "repo_name": p.repo_name,
            "url": p.repo_url,
            "repo_url": p.repo_url,
            "description": p.description,
            "language": p.language,
            "stars": p.stars_count,
            "stars_count": p.stars_count,
            "topics": p.topics,
            "generated_resume_bullet": p.generated_resume_bullet,
            "is_selected_for_resume": p.is_selected_for_resume,
        }
        for p in record.projects
    ]
    return success(out)


@router.get("/projects", summary="Get GitHub profile and projects")
def get_github_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == current_user.id))
    if not record:
        return success(None)
    out = GitHubProfileOut.model_validate(record).model_dump(mode="json")
    out["github_score"] = record.overall_score
    out["github_username"] = record.username
    out["stars_received"] = sum(p.stars_count for p in record.projects)
    out["public_repos"] = len(record.projects)
    out["repositories"] = [
        {
            "id": p.id,
            "name": p.repo_name,
            "repo_name": p.repo_name,
            "url": p.repo_url,
            "repo_url": p.repo_url,
            "description": p.description,
            "language": p.language,
            "stars": p.stars_count,
            "stars_count": p.stars_count,
            "topics": p.topics,
            "generated_resume_bullet": p.generated_resume_bullet,
            "is_selected_for_resume": p.is_selected_for_resume,
        }
        for p in record.projects
    ]
    return success(out)



@router.post("/projects/import", summary="Select GitHub projects to include in candidate resume")
def import_github_projects(
    payload: GitHubProjectImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.scalar(select(GitHubProfile).where(GitHubProfile.user_id == current_user.id))
    if not record:
        raise HTTPException(status_code=404, detail="GitHub profile not connected")

    for proj in record.projects:
        proj.is_selected_for_resume = proj.id in payload.project_ids

    db.commit()
    return success({"imported_count": len(payload.project_ids)})
