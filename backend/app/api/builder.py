from __future__ import annotations

import os
from typing import Any
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Resume, ResumeVersion, User
from app.schemas.resume import ResumeOut
from app.api.resume import resume_out
from app.services.github_service import generate_github_project_summary
from app.services.profile_service import build_unified_career_profile
from app.services.resume_generator_service import (
    audit_resume_for_ats,
    generate_goal_based_resume,
    improve_resume_section_with_ai,
)
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


class SectionImproveRequest(BaseModel):
    section_name: str
    content: str
    target_role: str | None = None


class GenerateResumeRequest(BaseModel):
    creation_goal: str = "General Resume"
    goal: str | None = None
    target_role: str | None = None
    target_company: str | None = None
    target_job_description: str | None = None
    job_description: str | None = None
    use_sources: Any = None


class SaveVersionRequest(BaseModel):
    version_title: str
    creation_goal: str = "General Resume"
    target_role: str | None = None
    target_company: str | None = None
    template_name: str = "classic"
    accent_color: str = "#059669"
    font_family: str = "Inter"
    font_size: int = 10
    page_size: str = "A4"
    resume_json: dict[str, Any]


class ExportDocxRequest(BaseModel):
    template_id: str = "modern"
    photo_filename: str | None = None
    personal_info: dict[str, Any] | None = None
    summary: str | None = ""
    experience: list[dict[str, Any]] | None = []
    education: list[dict[str, Any]] | None = []
    projects: list[dict[str, Any]] | None = []
    skills: Any = []
    resume_content: dict[str, Any] | None = None
    primary_color: str | None = None


TEMPLATES_LIST = [
    {"id": "classic", "name": "Classic", "category": "Traditional", "ats_friendly": True, "description": "Time-tested corporate layout with clean typography and elegant spacing."},
    {"id": "modern", "name": "Modern Emerald", "category": "Contemporary", "ats_friendly": True, "description": "Sleek tech header with emerald accents and structured bullet layout."},
    {"id": "minimal", "name": "Minimalist", "category": "Clean & Simple", "ats_friendly": True, "description": "Ultra-clean layout focused strictly on typography and content readability."},
    {"id": "professional", "name": "Corporate Professional", "category": "Corporate", "ats_friendly": True, "description": "Structured corporate template for software engineering and finance roles."},
    {"id": "ats_friendly", "name": "Strict ATS Optimizer", "category": "ATS Guaranteed", "ats_friendly": True, "description": "Single-column black & white layout engineered for 100% ATS parser compatibility."},
    {"id": "tech", "name": "Developer Tech", "category": "Engineering", "ats_friendly": True, "description": "Tailored for developers highlighting programming languages and GitHub repos."},
    {"id": "executive", "name": "Executive Leader", "category": "Management", "ats_friendly": True, "description": "Warm amber accents highlighting leadership experience and business impact."},
    {"id": "creative", "name": "Creative Studio", "category": "Design & Product", "ats_friendly": False, "description": "Indigo color palette for UX designers, product managers, and creative roles."},
    {"id": "student", "name": "Student / Intern", "category": "Entry Level", "ats_friendly": True, "description": "Emphasizes education, academic projects, coursework, and technical skills."},
    {"id": "academic", "name": "Academic CV", "category": "Research", "ats_friendly": True, "description": "Comprehensive academic layout suitable for research papers, teaching, and Ph.D. entries."},
]


@router.get("/templates", summary="List available resume templates")
def list_templates():
    return success(TEMPLATES_LIST)


@router.post("/generate", summary="Generate a goal-based resume using candidate Unified Profile")
async def generate_resume(
    payload: GenerateResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unified_profile = await run_in_threadpool(build_unified_career_profile, current_user, db)
    creation_goal = payload.goal or payload.creation_goal
    job_desc = payload.job_description or payload.target_job_description
    generated_content = await run_in_threadpool(
        generate_goal_based_resume,
        unified_profile,
        creation_goal,
        payload.target_role,
        payload.target_company,
        job_desc,
    )
    ats_audit = audit_resume_for_ats(generated_content)

    return success({
        "unified_profile": unified_profile,
        "resume_content": generated_content,
        "content": generated_content,
        "ats_audit": ats_audit,
    })


@router.post("/enrich-resume", summary="Auto-enrich and enlarge resume JSON with AI metric bullet points and skills")
async def enrich_resume(payload: dict[str, Any]):
    from app.services.resume_generator_service import enrich_and_expand_resume_content
    resume_json = payload.get("resume_content") or payload.get("resume_json") or payload
    target_role = payload.get("target_role") or resume_json.get("headline") or resume_json.get("name")
    goal = payload.get("goal") or payload.get("creation_goal") or "General Resume"
    
    enriched = await run_in_threadpool(enrich_and_expand_resume_content, resume_json, target_role, goal)
    ats_audit = audit_resume_for_ats(enriched)
    return success({
        "resume_content": enriched,
        "content": enriched,
        "ats_audit": ats_audit,
    })


@router.post("/improve", summary="Improve wording of a specific section with side-by-side comparison")
async def improve_section(payload: SectionImproveRequest):
    result = await run_in_threadpool(
        improve_resume_section_with_ai,
        payload.section_name,
        payload.content,
        payload.target_role,
    )
    return success(result)


@router.post("/ats-check", summary="Run pre-download ATS auditor on resume JSON")
def check_ats(payload: dict[str, Any]):
    audit = audit_resume_for_ats(payload)
    return success(audit)


@router.get("/versions", summary="List candidate's saved resume versions")
def list_versions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    versions = db.scalars(
        select(ResumeVersion).where(ResumeVersion.user_id == current_user.id).order_by(ResumeVersion.updated_at.desc())
    ).all()
    out = []
    for v in versions:
        out.append({
            "id": v.id,
            "version_title": v.version_title,
            "target_role": v.target_role,
            "creation_goal": v.creation_goal,
            "target_company": v.target_company,
            "template_name": v.template_name,
            "accent_color": v.accent_color,
            "font_family": v.font_family,
            "font_size": v.font_size,
            "page_size": v.page_size,
            "ats_score": v.ats_score,
            "resume_json": v.resume_json,
            "created_at": v.created_at.isoformat(),
            "updated_at": v.updated_at.isoformat(),
        })
    return success(out)


@router.post("/save-resume", status_code=status.HTTP_201_CREATED, summary="Save built resume version")
def save_resume(
    payload: dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return save_version(payload, current_user, db)


@router.post("/versions", status_code=status.HTTP_201_CREATED, summary="Save or create a new resume version")
def save_version(
    payload: dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    version_title = payload.get("version_title") or payload.get("filename") or "Built Resume"
    resume_json = payload.get("resume_json") or payload
    audit = audit_resume_for_ats(resume_json)
    
    version = ResumeVersion(
        user_id=current_user.id,
        version_title=version_title,
        target_role=payload.get("target_role", "Software Engineer"),
        creation_goal=payload.get("creation_goal", "General Resume"),
        target_company=payload.get("target_company"),
        template_name=payload.get("template_name", "classic"),
        accent_color=payload.get("accent_color", "#059669"),
        font_family=payload.get("font_family", "Inter"),
        font_size=payload.get("font_size", 10),
        page_size=payload.get("page_size", "A4"),
        ats_score=audit["ats_score"],
        resume_json=resume_json,
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    return success({
        "id": version.id,
        "version_title": version.version_title,
        "ats_score": version.ats_score,
        "created_at": version.created_at.isoformat(),
    })




@router.delete("/versions/{version_id}", summary="Delete a resume version")
def delete_version(
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    version = db.scalar(select(ResumeVersion).where(ResumeVersion.id == version_id, ResumeVersion.user_id == current_user.id))
    if not version:
        raise HTTPException(status_code=404, detail="Resume version not found")
    db.delete(version)
    db.commit()
    return success({"deleted": True, "id": version_id})


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


@router.post("/ai-enhance-bullet", summary="AI-enhance a draft experience/project bullet point")
async def ai_enhance_bullet(payload: EnhanceBulletRequest):
    enhanced = await run_in_threadpool(enhance_bullet_point, payload.bullet)
    return success({"original": payload.bullet, "enhanced": enhanced})


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

    export_payload = payload.resume_content or payload.model_dump(mode="json")
        
    file_path = await run_in_threadpool(
        generate_docx_resume,
        export_payload,
        payload.template_id,
        photo_path
    )
    
    filename = os.path.basename(file_path)
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )


@router.post("/export-pdf", summary="Export built resume as a PDF file")
async def export_pdf(payload: ExportDocxRequest):
    from app.services.pdf_export_service import generate_pdf_resume

    export_payload = payload.resume_content or payload.model_dump(mode="json")
    file_path = await run_in_threadpool(
        generate_pdf_resume,
        export_payload,
        payload.template_id,
        payload.primary_color,
    )

    filename = os.path.basename(file_path)
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename,
    )


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
