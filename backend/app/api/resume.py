from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Resume, User
from app.schemas.resume import ResumeOut, ResumeUploadOut
from app.services.pdf_parser import TextExtractionError
from app.services.resume_parser import extract_resume_text
from app.utils.file_validator import validate_upload
from app.utils.helpers import success

router = APIRouter(prefix="/api/resume", tags=["Resumes"])


def get_owned_resume(resume_id: int, user: User, db: Session) -> Resume:
    resume = db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


def resume_out(resume: Resume) -> ResumeOut:
    return ResumeOut(id=resume.id, filename=resume.filename, created_at=resume.created_at, text_length=len(resume.raw_text))


@router.post("/upload", status_code=status.HTTP_201_CREATED, summary="Upload and extract a PDF or DOCX resume")
async def upload_resume(file: UploadFile, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    validated = await validate_upload(file)
    settings = get_settings()
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    path = settings.uploads_dir / validated.filename
    try:
        path.write_bytes(validated.content)
        extracted_text = extract_resume_text(path)
    except TextExtractionError as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Unable to process the uploaded resume")
    resume = Resume(user_id=current_user.id, filename=validated.filename, file_path=validated.filename, raw_text=extracted_text)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    body = ResumeUploadOut(id=resume.id, filename=resume.filename, text_length=len(resume.raw_text))
    return success(body.model_dump())


@router.get("", summary="List the current user's resumes")
def list_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.scalars(select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc())).all()
    return success([resume_out(item).model_dump(mode="json") for item in resumes])


@router.get("/{resume_id}", summary="Get a resume metadata record")
def get_resume(resume_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return success(resume_out(get_owned_resume(resume_id, current_user, db)).model_dump(mode="json"))


@router.delete("/{resume_id}", summary="Delete a resume and its related analyses")
def delete_resume(resume_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = get_owned_resume(resume_id, current_user, db)
    stored_name = Path(resume.file_path).name
    db.delete(resume)
    db.commit()
    # file_path is never client-provided; name() prevents path traversal on legacy records.
    (get_settings().uploads_dir / stored_name).unlink(missing_ok=True)
    return success({"id": resume_id, "deleted": True})
