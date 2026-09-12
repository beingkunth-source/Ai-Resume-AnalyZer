from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.resume import get_owned_resume
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import ResumeAnalysis, User
from app.schemas.analysis import AIAnalysis, AnalysisListItem, AnalysisOut
from app.services.ai_analyzer import AIServiceUnavailable, analyze_resume_with_ai
from app.services.ats_scorer import score_resume
from app.utils.helpers import success

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


def analysis_out(record: ResumeAnalysis) -> AnalysisOut:
    stored = record.analysis_json
    ai = AIAnalysis.model_validate(stored["ai"])
    ats = stored.get("ats", {})
    return AnalysisOut(id=record.id, resume_id=record.resume_id, created_at=record.created_at, **ai.model_dump(), ats_checks=ats.get("checks", {}), ats_issues=ats.get("issues", []), ats_recommendations=ats.get("recommendations", []))


@router.post("/{resume_id}", summary="Run and persist a resume analysis")
async def create_analysis(resume_id: int, force: bool = False, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = get_owned_resume(resume_id, current_user, db)
    if not force:
        existing = db.scalar(select(ResumeAnalysis).where(ResumeAnalysis.resume_id == resume.id).order_by(ResumeAnalysis.created_at.desc()))
        if existing:
            return success(analysis_out(existing).model_dump(mode="json"))
    ats = score_resume(resume.raw_text)
    try:
        ai = await run_in_threadpool(analyze_resume_with_ai, resume.raw_text)
    except AIServiceUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    # Deterministic ATS scoring takes precedence over non-deterministic model scoring.
    ai_data = ai.model_dump()
    ai_data["scores"]["ats"] = ats["score"]
    ai_data["scores"]["overall"] = round(sum(ai_data["scores"].values()) / len(ai_data["scores"]), 1)
    combined = AIAnalysis.model_validate(ai_data)
    scores = combined.scores
    record = ResumeAnalysis(resume_id=resume.id, overall_score=scores.overall, ats_score=scores.ats, skills_score=scores.skills, experience_score=scores.experience, education_score=scores.education, projects_score=scores.projects, formatting_score=scores.formatting, keyword_score=scores.keywords, impact_score=scores.impact, analysis_json={"ai": combined.model_dump(), "ats": ats})
    db.add(record)
    db.commit()
    db.refresh(record)
    return success(analysis_out(record).model_dump(mode="json"))


@router.get("", summary="List analysis history for the current user")
def list_analyses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.scalars(select(ResumeAnalysis).join(ResumeAnalysis.resume).where(ResumeAnalysis.resume.has(user_id=current_user.id)).order_by(ResumeAnalysis.created_at.desc())).all()
    result = [AnalysisListItem(id=x.id, resume_id=x.resume_id, overall_score=x.overall_score, ats_score=x.ats_score, created_at=x.created_at).model_dump(mode="json") for x in records]
    return success(result)


@router.get("/{analysis_id}", summary="Get a complete owned analysis")
def get_analysis(analysis_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.scalar(select(ResumeAnalysis).join(ResumeAnalysis.resume).where(ResumeAnalysis.id == analysis_id, ResumeAnalysis.resume.has(user_id=current_user.id)))
    if record is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return success(analysis_out(record).model_dump(mode="json"))
