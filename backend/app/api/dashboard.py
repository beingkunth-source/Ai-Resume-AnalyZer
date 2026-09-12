from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import JobMatch, Resume, ResumeAnalysis, User
from app.utils.helpers import success

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", summary="Get dashboard metrics for the authenticated user")
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_resumes = db.scalar(select(func.count()).select_from(Resume).where(Resume.user_id == current_user.id)) or 0
    analysis_filter = ResumeAnalysis.resume.has(user_id=current_user.id)
    total_analyses = db.scalar(select(func.count()).select_from(ResumeAnalysis).where(analysis_filter)) or 0
    average_score = db.scalar(select(func.avg(ResumeAnalysis.overall_score)).where(analysis_filter))
    average_ats_score = db.scalar(select(func.avg(ResumeAnalysis.ats_score)).where(analysis_filter))
    latest = db.scalar(select(ResumeAnalysis).where(analysis_filter).order_by(ResumeAnalysis.created_at.desc()))
    latest_resume = db.scalar(select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()))
    latest_job_match = db.scalar(select(JobMatch).join(JobMatch.resume).where(JobMatch.resume.has(user_id=current_user.id)).order_by(JobMatch.created_at.desc()))
    recent = db.scalars(select(ResumeAnalysis).where(analysis_filter).order_by(ResumeAnalysis.created_at.desc()).limit(5)).all()
    return success({
        "total_resumes": total_resumes, "total_analyses": total_analyses,
        "latest_resume": {"id": latest_resume.id, "filename": latest_resume.filename} if latest_resume else None,
        "average_score": round(float(average_score), 1) if average_score is not None else None,
        "average_ats_score": round(float(average_ats_score), 1) if average_ats_score is not None else None,
        "latest_score": latest.overall_score if latest else None,
        "latest_job_match_score": latest_job_match.match_score if latest_job_match else None,
        "recent_analyses": [{"id": item.id, "resume_id": item.resume_id, "overall_score": item.overall_score, "ats_score": item.ats_score, "created_at": item.created_at.isoformat()} for item in recent],
    })
