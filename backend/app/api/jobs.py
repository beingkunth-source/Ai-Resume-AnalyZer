from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.resume import get_owned_resume
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import JobDescription, JobMatch, User
from app.schemas.job import (
    JobDescriptionCreate,
    JobDescriptionListItem,
    JobDescriptionOut,
    JobMatchOut,
    JobMatchRequest,
)
from app.services.job_matcher import match_resume_to_job
from app.services.live_jobs_service import extract_job_from_url, fetch_live_jobs
from app.utils.helpers import success

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


class JobImportRequest(BaseModel):
    url: str


def get_owned_job(job_id: int, user: User, db: Session) -> JobDescription:
    job = db.scalar(select(JobDescription).where(JobDescription.id == job_id, JobDescription.user_id == user.id))
    if job is None:
        raise HTTPException(status_code=404, detail="Job description not found")
    return job


@router.get("/live", summary="Fetch live job vacancies from Naukri & LinkedIn")
async def get_live_jobs(
    q: str = Query(default=""),
    location: str = Query(default=""),
):
    jobs = await run_in_threadpool(fetch_live_jobs, q, location)
    return success(jobs)


@router.post("/import-url", summary="Import and parse job description from Naukri / LinkedIn URL")
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


@router.get("", summary="List the current user's job descriptions")
def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.scalars(select(JobDescription).where(JobDescription.user_id == current_user.id).order_by(JobDescription.created_at.desc())).all()
    return success([JobDescriptionListItem.model_validate(j).model_dump(mode="json") for j in jobs])


@router.get("/{job_id}", summary="Get a job description")
def get_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = get_owned_job(job_id, current_user, db)
    return success(JobDescriptionOut.model_validate(job).model_dump(mode="json"))


@router.delete("/{job_id}", summary="Delete a job description and its matches")
def delete_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = get_owned_job(job_id, current_user, db)
    db.delete(job)
    db.commit()
    return success({"id": job_id, "deleted": True})


@router.post("/match", summary="Match an owned resume to a stored job description")
async def match_job(payload: JobMatchRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = get_owned_resume(payload.resume_id, current_user, db)
    job = get_owned_job(payload.job_id, current_user, db)
    match = await run_in_threadpool(match_resume_to_job, resume.raw_text, job.description)
    record = JobMatch(
        resume_id=resume.id,
        job_id=job.id,
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
    output = JobMatchOut(id=record.id, job_id=job.id, resume_id=resume.id, created_at=record.created_at, **match)
    return success(output.model_dump(mode="json"))
