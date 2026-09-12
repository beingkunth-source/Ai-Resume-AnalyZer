from __future__ import annotations

import os
from typing import Any
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Resume, User
from app.schemas.resume import ResumeOut
from app.api.resume import resume_out
from app.services.github_service import generate_github_project_summary
from app.services.linkedin_service import (
    enhance_bullet_point,
    parse_linkedin_file,
    parse_linkedin_text,
    parse_linkedin_url,
)
from app.utils.helpers import success

router = APIRouter(prefix="/api/builder", tags=["Builder"])


class GitHubSummaryRequest(BaseModel):
    url: str


class LinkedInImportRequest(BaseModel):
    url: str | None = None
    text: str | None = None


class EnhanceBulletRequest(BaseModel):
    bullet: str


class SaveResumeRequest(BaseModel):
    filename: str = "My_Built_Resume.txt"
    personal_info: dict[str, Any]
    summary: str | None = ""
    experience: list[dict[str, Any]] = []
    education: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []
    skills: list[str] = []


@router.post("/github-summarize", summary="Extract and summarize GitHub repo into ATS project key points")
async def github_summarize(payload: GitHubSummaryRequest):
    try:
        summary = await run_in_threadpool(generate_github_project_summary, payload.url)
        return success(summary)
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Failed to process GitHub repository: {err}")


@router.post("/linkedin-import", summary="Import LinkedIn profile details via URL or text")
async def linkedin_import(payload: LinkedInImportRequest):
    if payload.url and payload.url.strip():
        data = await run_in_threadpool(parse_linkedin_url, payload.url.strip())
        return success(data)
    elif payload.text and payload.text.strip():
        data = await run_in_threadpool(parse_linkedin_text, payload.text.strip())
        return success(data)
    else:
        raise HTTPException(status_code=400, detail="Please provide a LinkedIn URL or profile text")


@router.post("/linkedin-upload-file", summary="Extract text and fields from uploaded LinkedIn PDF export or screenshot")
async def linkedin_upload_file(file: UploadFile = File(...)):
    content = await file.read()
    data = await run_in_threadpool(parse_linkedin_file, content, file.filename)
    return success(data)


@router.post("/linkedin-upload-screenshot", summary="Extract text and fields from LinkedIn profile screenshot")
async def linkedin_upload_screenshot(file: UploadFile = File(...)):
    content = await file.read()
    data = await run_in_threadpool(parse_linkedin_file, content, file.filename)
    return success(data)


@router.post("/ai-enhance-bullet", summary="AI-enhance a draft experience/project bullet point")
async def ai_enhance_bullet(payload: EnhanceBulletRequest):
    enhanced = await run_in_threadpool(enhance_bullet_point, payload.bullet)
    return success({"original": payload.bullet, "enhanced": enhanced})


@router.post("/save-resume", status_code=status.HTTP_201_CREATED, summary="Compile built resume and save to database")
def save_built_resume(
    payload: SaveResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = get_settings()

    # Compile structured state into formatted plain text ATS resume
    lines = []
    p = payload.personal_info
    lines.append(p.get("name", "CANDIDATE NAME").upper())
    
    contact_parts = []
    if p.get("email"): contact_parts.append(p["email"])
    if p.get("phone"): contact_parts.append(p["phone"])
    if p.get("location"): contact_parts.append(p["location"])
    if p.get("linkedin"): contact_parts.append(p["linkedin"])
    if p.get("github"): contact_parts.append(p["github"])
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append("")

    if payload.summary:
        lines.append("PROFESSIONAL SUMMARY")
        lines.append("-" * 30)
        lines.append(payload.summary)
        lines.append("")

    if payload.experience:
        lines.append("WORK EXPERIENCE")
        lines.append("-" * 30)
        for exp in payload.experience:
            lines.append(f"{exp.get('title', 'Role')} - {exp.get('company', 'Company')} ({exp.get('dates', '')})")
            if exp.get("description"):
                for b in exp["description"].split("\n"):
                    if b.strip():
                        lines.append(f"• {b.strip().lstrip('• ')}")
            lines.append("")

    if payload.projects:
        lines.append("KEY PROJECTS")
        lines.append("-" * 30)
        for proj in payload.projects:
            tech_str = f" [{', '.join(proj.get('tech_stack', []))}]" if proj.get("tech_stack") else ""
            lines.append(f"{proj.get('name', 'Project')}{tech_str} - {proj.get('url', '')}")
            if proj.get("key_points"):
                for kp in proj["key_points"]:
                    if kp.strip():
                        lines.append(f"• {kp.strip().lstrip('• ')}")
            lines.append("")

    if payload.education:
        lines.append("EDUCATION")
        lines.append("-" * 30)
        for edu in payload.education:
            lines.append(f"{edu.get('degree', 'Degree')}, {edu.get('institution', 'University')} ({edu.get('dates', '')})")
        lines.append("")

    if payload.skills:
        lines.append("TECHNICAL SKILLS")
        lines.append("-" * 30)
        lines.append(", ".join(payload.skills))
        lines.append("")

    raw_text = "\n".join(lines)

    # Save to uploads directory
    os.makedirs(settings.uploads_dir, exist_ok=True)
    safe_filename = f"built_{current_user.id}_{payload.filename.replace(' ', '_')}"
    if not safe_filename.endswith(".txt"):
        safe_filename += ".txt"
    file_path = os.path.join(settings.uploads_dir, safe_filename)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(raw_text)

    resume = Resume(
        user_id=current_user.id,
        filename=payload.filename,
        file_path=file_path,
        raw_text=raw_text,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return success(resume_out(resume).model_dump(mode="json"))


class ExportDocxRequest(BaseModel):
    template_id: str = "modern"
    photo_filename: str | None = None
    personal_info: dict[str, Any]
    summary: str | None = ""
    experience: list[dict[str, Any]] = []
    education: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []
    skills: list[str] = []


@router.post("/upload-photo", summary="Upload candidate profile photo for resume templates")
async def upload_photo(file: UploadFile = File(...)):
    settings = get_settings()
    os.makedirs(settings.uploads_dir, exist_ok=True)
    filename = f"photo_{os.urandom(6).hex()}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.uploads_dir, filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    return success({"photo_filename": filename, "photo_url": f"/api/builder/photo/{filename}"})


@router.get("/photo/{filename}", summary="Get candidate profile photo")
def get_photo(filename: str):
    settings = get_settings()
    file_path = os.path.join(settings.uploads_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(file_path)


@router.post("/export-docx", summary="Export built resume as a styled Microsoft Word (.docx) file")
async def export_docx(payload: ExportDocxRequest):
    settings = get_settings()
    from app.services.resume_export_service import generate_docx_resume
    
    photo_path = None
    if payload.photo_filename:
        photo_path = os.path.join(settings.uploads_dir, payload.photo_filename)
        
    file_path = await run_in_threadpool(
        generate_docx_resume,
        payload.model_dump(mode="json"),
        payload.template_id,
        photo_path
    )
    
    filename = os.path.basename(file_path)
    return success({
        "filename": filename,
        "download_url": f"/api/builder/download-docx/{filename}"
    })


@router.get("/download-docx/{filename}", summary="Download generated DOCX resume file")
def download_docx(filename: str):
    settings = get_settings()
    file_path = os.path.join(settings.uploads_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested DOCX file not found")
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )
