from __future__ import annotations

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Application, Job, User
from app.schemas.applications import ApplicationCreate, ApplicationOut, ApplicationUpdate
from app.utils.helpers import success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Track a new job application")
def track_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.scalar(select(Job).where(Job.id == payload.job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found in system")

    existing = db.scalar(
        select(Application).where(Application.user_id == current_user.id, Application.job_id == job.id)
    )

    applied_time = datetime.now(timezone.utc) if payload.status == "Applied" else None

    if existing:
        existing.status = payload.status
        if payload.notes is not None:
            existing.notes = payload.notes
        if payload.status == "Applied" and not existing.applied_at:
            existing.applied_at = applied_time
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = Application(
            user_id=current_user.id,
            job_id=job.id,
            status=payload.status,
            applied_at=applied_time,
            notes=payload.notes,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return success({
        "id": record.id,
        "user_id": record.user_id,
        "job_id": record.job_id,
        "status": record.status,
        "notes": record.notes,
        "applied_at": record.applied_at.isoformat() if record.applied_at else None,
        "created_at": record.created_at.isoformat(),
        "job": {
            "id": str(job.id),
            "source": job.source,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "url": job.url,
        }
    })


@router.get("", summary="Get all candidate job application records")
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = db.scalars(
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
    ).all()

    output = []
    for r in records:
        job = r.job
        output.append({
            "id": r.id,
            "user_id": r.user_id,
            "job_id": r.job_id,
            "status": r.status,
            "notes": r.notes,
            "applied_at": r.applied_at.isoformat() if r.applied_at else None,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat(),
            "job": {
                "id": str(job.id),
                "external_id": job.external_id,
                "source": job.source,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "employment_type": job.employment_type,
                "salary": job.salary,
                "url": job.url,
                "skills": job.skills,
            } if job else None
        })

    return success(output)


@router.patch("/{app_id}", summary="Update application status or notes")
def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app_record = db.scalar(
        select(Application).where(Application.id == app_id, Application.user_id == current_user.id)
    )
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    if payload.status:
        app_record.status = payload.status
        if payload.status == "Applied" and not app_record.applied_at:
            app_record.applied_at = datetime.now(timezone.utc)
    
    if payload.notes is not None:
        app_record.notes = payload.notes

    db.commit()
    db.refresh(app_record)

    return success({
        "id": app_record.id,
        "status": app_record.status,
        "notes": app_record.notes,
        "updated_at": app_record.updated_at.isoformat(),
    })


@router.delete("/{app_id}", summary="Delete an application record")
def delete_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app_record = db.scalar(
        select(Application).where(Application.id == app_id, Application.user_id == current_user.id)
    )
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    db.delete(app_record)
    db.commit()
    return success({"deleted": True, "id": app_id})
