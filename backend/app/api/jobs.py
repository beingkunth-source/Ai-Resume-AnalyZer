from __future__ import annotations

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.api.resume import get_owned_resume
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Job, JobDescription, JobMatch, SavedJob, User, Application
from app.schemas.job import (
    JobDescriptionCreate,
    JobDescriptionListItem,
    JobDescriptionOut,
    JobMatchOut,
    JobMatchRequest,
)
from app.services.candidate_profile_service import extract_candidate_profile
from app.services.hybrid_matcher import calculate_hybrid_job_match
from app.services.job_matcher import match_resume_to_job
from app.services.providers.provider_manager import job_provider_manager
from app.services.live_jobs_service import extract_job_from_url, fetch_live_jobs
from app.utils.helpers import success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


class JobImportRequest(BaseModel):
    url: str


def _get_or_create_job_db(raw_job: dict[str, Any], db: Session) -> Job:
    """Helper to store or retrieve normalized job in database."""
    ext_id = str(raw_job.get("external_id") or raw_job.get("id"))
    source = str(raw_job.get("source", "Generic"))

    existing = db.scalar(
        select(Job).where(Job.source == source, Job.external_id == ext_id)
    )
    if existing:
        return existing

    job_db = Job(
        external_id=ext_id,
        source=source,
        title=raw_job.get("title", "Software Developer"),
        company=raw_job.get("company", "Tech Company"),
        location=raw_job.get("location", "Remote"),
        employment_type=raw_job.get("employment_type", "Full-time"),
        experience_required=raw_job.get("experience_required"),
        salary=raw_job.get("salary"),
        description=raw_job.get("description", ""),
        skills=raw_job.get("skills", []),
        url=raw_job.get("url", "https://naukri.com"),
        posted_at=raw_job.get("posted_at"),
        source_logo=raw_job.get("source_logo"),
    )
    db.add(job_db)
    db.commit()
    db.refresh(job_db)
    return job_db


@router.get("/recommended/{resume_id}", summary="Get personalized job recommendations for a candidate resume")
async def get_recommended_jobs(
    resume_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_owned_resume(resume_id, current_user, db)
    
    # 1. Extract Candidate Job Profile & Search Parameters
    candidate_profile = await run_in_threadpool(extract_candidate_profile, resume.raw_text)
    search_params = candidate_profile.get("search_params", {})
    keywords = search_params.get("keywords", [])
    query = " ".join(keywords[:3]) if keywords else candidate_profile["target_roles"][0]

    # 2. Discover Jobs from Providers
    raw_jobs, providers_status = await run_in_threadpool(
        job_provider_manager.search_all_providers,
        query=query,
        location=search_params.get("location", ""),
        experience=search_params.get("experience", ""),
        remote=search_params.get("remote", False),
        limit=50,
    )

    # 3. Score Jobs using Fast Hybrid Matcher
    scored_jobs = []
    saved_job_ids = set(db.scalars(select(SavedJob.job_id).where(SavedJob.user_id == current_user.id)).all())
    app_statuses = {app.job_id: app.status for app in db.scalars(select(Application).where(Application.user_id == current_user.id)).all()}

    for raw_job in raw_jobs:
        ext_id = str(raw_job.get("external_id") or raw_job.get("id"))
        source = str(raw_job.get("source", "Generic"))

        existing = db.scalar(
            select(Job).where(Job.source == source, Job.external_id == ext_id)
        )
        if existing:
            job_db_id = existing.id
        else:
            job_db = Job(
                external_id=ext_id,
                source=source,
                title=raw_job.get("title", "Software Developer"),
                company=raw_job.get("company", "Tech Company"),
                location=raw_job.get("location", "Remote"),
                employment_type=raw_job.get("employment_type", "Full-time"),
                experience_required=raw_job.get("experience_required"),
                salary=raw_job.get("salary"),
                description=raw_job.get("description", ""),
                skills=raw_job.get("skills", []),
                url=raw_job.get("url", "https://naukri.com"),
                posted_at=raw_job.get("posted_at"),
                source_logo=raw_job.get("source_logo"),
            )
            db.add(job_db)
            db.flush()
            job_db_id = job_db.id

        match_res = await run_in_threadpool(
            calculate_hybrid_job_match,
            resume.raw_text,
            raw_job,
            candidate_profile,
            False,
        )
        
        if match_res["match_score"] >= 50 or len(raw_jobs) <= 5:
            scored_jobs.append({
                "job": raw_job,
                "job_db_id": job_db_id,
                "match_score": match_res["match_score"],
                "category": match_res["category"],
                "matched_skills": match_res["matched_skills"],
                "missing_skills": match_res["missing_skills"],
                "explanation": match_res["explanation"],
                "is_saved": job_db_id in saved_job_ids,
                "application_status": app_statuses.get(job_db_id),
            })

    db.commit()

    # 4. Sort by Match Score Descending
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)

    # Pagination slice
    start_idx = (page - 1) * limit
    paginated_results = scored_jobs[start_idx : start_idx + limit]

    return success({
        "candidate_profile": candidate_profile,
        "results": paginated_results,
        "total": len(scored_jobs),
        "page": page,
        "limit": limit,
        "providers_status": providers_status,
    })


@router.get("/search", summary="Search jobs with filters and optional resume matching")
async def search_jobs(
    query: str = Query(default=""),
    location: str = Query(default=""),
    experience: str = Query(default=""),
    remote: bool = Query(default=False),
    source: str = Query(default="all"),
    resume_id: int | None = Query(default=None),
    min_score: float = Query(default=0),
    sort_by: str = Query(default="match"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw_jobs, providers_status = await run_in_threadpool(
        job_provider_manager.search_all_providers,
        query=query,
        location=location,
        experience=experience,
        remote=remote,
        source_filter=source,
        page=page,
        limit=limit * 2,
    )

    resume_text = None
    cand_profile = None
    if resume_id:
        try:
            resume = get_owned_resume(resume_id, current_user, db)
            resume_text = resume.raw_text
            cand_profile = await run_in_threadpool(extract_candidate_profile, resume_text)
        except Exception:
            pass

    saved_job_ids = set(db.scalars(select(SavedJob.job_id).where(SavedJob.user_id == current_user.id)).all())
    app_statuses = {app.job_id: app.status for app in db.scalars(select(Application).where(Application.user_id == current_user.id)).all()}

    scored_jobs = []
    for raw_job in raw_jobs:
        job_db = _get_or_create_job_db(raw_job, db)
        
        match_score = 0.0
        category = "UNSCORED"
        matched_skills = []
        missing_skills = []
        explanation = None

        if resume_text:
            match_res = await run_in_threadpool(
                calculate_hybrid_job_match,
                resume_text,
                raw_job,
                cand_profile,
                False,
            )
            match_score = match_res["match_score"]
            category = match_res["category"]
            matched_skills = match_res["matched_skills"]
            missing_skills = match_res["missing_skills"]
            explanation = match_res["explanation"]

        if match_score >= min_score:
            scored_jobs.append({
                "job": raw_job,
                "job_db_id": job_db.id,
                "match_score": match_score,
                "category": category,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "explanation": explanation,
                "is_saved": job_db.id in saved_job_ids,
                "application_status": app_statuses.get(job_db.id),
            })

    if resume_text and sort_by == "match":
        scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)

    start_idx = (page - 1) * limit
    paginated_results = scored_jobs[start_idx : start_idx + limit]

    return success({
        "results": paginated_results,
        "total": len(scored_jobs),
        "page": page,
        "limit": limit,
        "providers_status": providers_status,
        "candidate_profile": cand_profile,
    })


@router.post("/match", summary="Match a resume to a stored job description or job object")
async def match_job(
    payload: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_owned_resume(payload.resume_id, current_user, db)

    # Check if job_id refers to a JobDescription
    if payload.job_id and (isinstance(payload.job_id, int) or str(payload.job_id).isdigit()):
        job_desc_id = int(payload.job_id)
        job_desc_any = db.scalar(select(JobDescription).where(JobDescription.id == job_desc_id))
        if job_desc_any:
            if job_desc_any.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="Job description not found")

            match = await run_in_threadpool(match_resume_to_job, resume.raw_text, job_desc_any.description)
            record = JobMatch(
                user_id=current_user.id,
                resume_id=resume.id,
                job_id=job_desc_any.id,
                match_score=match["job_match_score"],
                matched_skills=match["matched_skills"],
                partially_matched_skills=match["partially_matched_skills"],
                missing_skills=match["missing_skills"],
                matched_keywords=match["matched_keywords"],
                missing_keywords=match["missing_keywords"],
                recommendations=match["recommendations"],
                analysis_json=match,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            output = JobMatchOut(
                id=record.id,
                job_id=job_desc_any.id,
                resume_id=resume.id,
                created_at=record.created_at,
                match_score=match["job_match_score"],
                job_match_score=match["job_match_score"],
                matched_skills=match["matched_skills"],
                partially_matched_skills=match["partially_matched_skills"],
                missing_skills=match["missing_skills"],
                matched_keywords=match["matched_keywords"],
                missing_keywords=match["missing_keywords"],
                strengths_for_this_job=match.get("strengths_for_this_job", []),
                gaps_for_this_job=match.get("gaps_for_this_job", []),
                recommendations=match.get("recommendations", []),
                semantic_similarity=match.get("semantic_similarity"),
            )
            return success(output.model_dump(mode="json"))


    # Match against normalized job or custom job payload
    target_job_dict = None
    job_db_id = None

    if payload.job_object:
        target_job_dict = payload.job_object.model_dump(mode="json")
    elif payload.job_id:
        job_obj = db.scalar(select(Job).where(Job.id == int(payload.job_id))) if str(payload.job_id).isdigit() else db.scalar(select(Job).where(Job.external_id == str(payload.job_id)))
        if job_obj:
            job_db_id = job_obj.id
            target_job_dict = {
                "id": str(job_obj.id),
                "external_id": job_obj.external_id,
                "source": job_obj.source,
                "title": job_obj.title,
                "company": job_obj.company,
                "location": job_obj.location,
                "employment_type": job_obj.employment_type,
                "experience_required": job_obj.experience_required,
                "salary": job_obj.salary,
                "description": job_obj.description,
                "skills": job_obj.skills,
                "url": job_obj.url,
                "posted_at": job_obj.posted_at,
                "source_logo": job_obj.source_logo,
            }

    if not target_job_dict:
        raise HTTPException(status_code=400, detail="Invalid job specification provided for matching")

    match_res = await run_in_threadpool(
        calculate_hybrid_job_match,
        resume.raw_text,
        target_job_dict,
        None,
        True,
    )

    if job_db_id:
        record = JobMatch(
            user_id=current_user.id,
            resume_id=resume.id,
            normalized_job_id=job_db_id,
            match_score=match_res["match_score"],
            matched_skills=match_res["matched_skills"],
            missing_skills=match_res["missing_skills"],
            matched_keywords=match_res["matched_keywords"],
            missing_keywords=match_res["missing_keywords"],
            recommendations=match_res["explanation"].get("recommendations", []) if isinstance(match_res.get("explanation"), dict) else [],
            explanation=match_res["explanation"],
            analysis_json=match_res,
        )
        db.add(record)
        db.commit()

    return success({
        "job": target_job_dict,
        "resume_id": resume.id,
        "job_match_score": match_res["match_score"],
        "category": match_res["category"],
        "matched_skills": match_res["matched_skills"],
        "missing_skills": match_res["missing_skills"],
        "explanation": match_res["explanation"],
    })


@router.get("/saved", summary="Get candidate's saved jobs")
def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved_entries = db.scalars(
        select(SavedJob).where(SavedJob.user_id == current_user.id).order_by(SavedJob.created_at.desc())
    ).all()

    jobs_out = []
    for entry in saved_entries:
        job = entry.job
        if job:
            jobs_out.append({
                "saved_id": entry.id,
                "job_db_id": job.id,
                "saved_at": entry.created_at.isoformat(),
                "job": {
                    "id": str(job.id),
                    "external_id": job.external_id,
                    "source": job.source,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "employment_type": job.employment_type,
                    "experience_required": job.experience_required,
                    "salary": job.salary,
                    "description": job.description,
                    "skills": job.skills,
                    "url": job.url,
                    "posted_at": job.posted_at,
                    "source_logo": job.source_logo,
                }
            })

    return success(jobs_out)


@router.get("/live", summary="Fetch live job vacancies from Naukri & LinkedIn")
async def get_live_jobs(
    q: str = Query(default=""),
    location: str = Query(default=""),
):
    jobs = await run_in_threadpool(fetch_live_jobs, q, location)
    return success(jobs)


@router.post("/import-url", summary="Import and parse job description from URL")
async def import_job_from_url(
    payload: JobImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        extracted = await run_in_threadpool(extract_job_from_url, payload.url)
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Could not import job from URL: {err}")

    job = JobDescription(
        user_id=current_user.id,
        title=extracted["title"],
        company=extracted["company"],
        description=extracted["description"],
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return success(JobDescriptionOut.model_validate(job).model_dump(mode="json"))


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a job description")
def create_job(payload: JobDescriptionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = JobDescription(
        user_id=current_user.id,
        title=payload.title.strip(),
        company=payload.company.strip() if payload.company else None,
        description=payload.description.strip(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return success(JobDescriptionOut.model_validate(job).model_dump(mode="json"))


@router.get("", summary="List the current user's stored job descriptions")
def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.scalars(select(JobDescription).where(JobDescription.user_id == current_user.id).order_by(JobDescription.created_at.desc())).all()
    return success([JobDescriptionListItem.model_validate(j).model_dump(mode="json") for j in jobs])


@router.post("/{job_id}/save", summary="Save a job to user's saved jobs list")
def save_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_job = None
    if job_id.isdigit():
        target_job = db.scalar(select(Job).where(Job.id == int(job_id)))
    if not target_job:
        target_job = db.scalar(select(Job).where(Job.external_id == job_id))

    if not target_job:
        raise HTTPException(status_code=404, detail="Job not found in system repository")

    existing = db.scalar(
        select(SavedJob).where(SavedJob.user_id == current_user.id, SavedJob.job_id == target_job.id)
    )
    if not existing:
        saved = SavedJob(user_id=current_user.id, job_id=target_job.id)
        db.add(saved)
        db.commit()

    return success({"saved": True, "job_id": target_job.id})


@router.delete("/{job_id}/save", summary="Remove a job from user's saved jobs")
def unsave_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_job = None
    if job_id.isdigit():
        target_job = db.scalar(select(Job).where(Job.id == int(job_id)))
    if not target_job:
        target_job = db.scalar(select(Job).where(Job.external_id == job_id))

    if target_job:
        db.execute(
            delete(SavedJob).where(SavedJob.user_id == current_user.id, SavedJob.job_id == target_job.id)
        )
        db.commit()

    return success({"saved": False, "job_id": job_id})


@router.get("/{job_id}", summary="Get job details")
def get_job_detail(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if job_id.isdigit():
        jd_id = int(job_id)
        jd_any = db.scalar(select(JobDescription).where(JobDescription.id == jd_id))
        if jd_any:
            if jd_any.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="Job description not found")
            return success(JobDescriptionOut.model_validate(jd_any).model_dump(mode="json"))

        job_db = db.scalar(select(Job).where(Job.id == jd_id))
        if job_db:
            return success({
                "id": str(job_db.id),
                "external_id": job_db.external_id,
                "source": job_db.source,
                "title": job_db.title,
                "company": job_db.company,
                "location": job_db.location,
                "employment_type": job_db.employment_type,
                "experience_required": job_db.experience_required,
                "salary": job_db.salary,
                "description": job_db.description,
                "skills": job_db.skills,
                "url": job_db.url,
                "posted_at": job_db.posted_at,
                "source_logo": job_db.source_logo,
            })
            
    raise HTTPException(status_code=404, detail="Job not found")


@router.delete("/{job_id}", summary="Delete a job description and its matches")
def delete_job(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not job_id.isdigit():
        raise HTTPException(status_code=404, detail="Job description not found")

    jd_id = int(job_id)
    jd_any = db.scalar(select(JobDescription).where(JobDescription.id == jd_id))
    if not jd_any or jd_any.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job description not found")

    db.delete(jd_any)
    db.commit()
    return success({"id": jd_id, "deleted": True})
