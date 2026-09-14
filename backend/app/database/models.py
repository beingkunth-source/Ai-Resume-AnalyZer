from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    
    resumes: Mapped[list["Resume"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    jobs: Mapped[list["JobDescription"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    saved_jobs: Mapped[list["SavedJob"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    profile: Mapped["Profile | None"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
    linkedin_profile: Mapped["LinkedInProfile | None"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
    github_profile: Mapped["GitHubProfile | None"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
    resume_versions: Mapped[list["ResumeVersion"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(255))
    location: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    portfolio_url: Mapped[str | None] = mapped_column(String(500))
    website_url: Mapped[str | None] = mapped_column(String(500))
    linkedin_url: Mapped[str | None] = mapped_column(String(500))
    github_url: Mapped[str | None] = mapped_column(String(500))
    current_status: Mapped[str] = mapped_column(String(100), default="Working Professional")
    user_goals: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    target_roles: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    work_mode: Mapped[str] = mapped_column(String(50), default="Any")
    location_preferences: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    has_existing_resume: Mapped[bool] = mapped_column(default=False)
    has_completed_onboarding: Mapped[bool] = mapped_column(default=False)
    profile_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="profile")


class LinkedInProfile(Base):
    __tablename__ = "linkedin_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    profile_url: Mapped[str | None] = mapped_column(String(500))
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    headline_score: Mapped[float] = mapped_column(Float, default=0.0)
    about_score: Mapped[float] = mapped_column(Float, default=0.0)
    experience_score: Mapped[float] = mapped_column(Float, default=0.0)
    skills_score: Mapped[float] = mapped_column(Float, default=0.0)
    keywords_score: Mapped[float] = mapped_column(Float, default=0.0)
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0)
    headline: Mapped[str | None] = mapped_column(Text)
    about: Mapped[str | None] = mapped_column(Text)
    suggested_headline: Mapped[str | None] = mapped_column(Text)
    suggested_about: Mapped[str | None] = mapped_column(Text)
    analysis_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="linkedin_profile")


class GitHubProfile(Base):
    __tablename__ = "github_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    username: Mapped[str | None] = mapped_column(String(120))
    profile_url: Mapped[str | None] = mapped_column(String(500))
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    top_languages: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    top_technologies: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    analysis_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="github_profile")
    projects: Mapped[list["GitHubProject"]] = relationship(back_populates="github_profile", cascade="all, delete-orphan")


class GitHubProject(Base):
    __tablename__ = "github_projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    github_profile_id: Mapped[int] = mapped_column(ForeignKey("github_profiles.id", ondelete="CASCADE"), index=True)
    repo_name: Mapped[str] = mapped_column(String(255), nullable=False)
    repo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(100))
    stars_count: Mapped[int] = mapped_column(Integer, default=0)
    topics: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    generated_resume_bullet: Mapped[str | None] = mapped_column(Text)
    is_selected_for_resume: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    github_profile: Mapped[GitHubProfile] = relationship(back_populates="projects")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    version_title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_role: Mapped[str | None] = mapped_column(String(255))
    creation_goal: Mapped[str] = mapped_column(String(100), default="General Resume")
    target_company: Mapped[str | None] = mapped_column(String(255))
    target_job_description: Mapped[str | None] = mapped_column(Text)
    template_name: Mapped[str] = mapped_column(String(100), default="classic")
    accent_color: Mapped[str] = mapped_column(String(50), default="#059669")
    font_family: Mapped[str] = mapped_column(String(100), default="Inter")
    font_size: Mapped[int] = mapped_column(Integer, default=10)
    page_size: Mapped[str] = mapped_column(String(20), default="A4")
    ats_score: Mapped[float] = mapped_column(Float, default=0.0)
    resume_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="resume_versions")



class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    user: Mapped[User] = relationship(back_populates="resumes")
    analyses: Mapped[list["ResumeAnalysis"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    matches: Mapped[list["JobMatch"]] = relationship(back_populates="resume", cascade="all, delete-orphan")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    ats_score: Mapped[float] = mapped_column(Float, nullable=False)
    skills_score: Mapped[float] = mapped_column(Float, nullable=False)
    experience_score: Mapped[float] = mapped_column(Float, nullable=False)
    education_score: Mapped[float] = mapped_column(Float, nullable=False)
    projects_score: Mapped[float] = mapped_column(Float, nullable=False)
    formatting_score: Mapped[float] = mapped_column(Float, nullable=False)
    keyword_score: Mapped[float] = mapped_column(Float, nullable=False)
    impact_score: Mapped[float] = mapped_column(Float, nullable=False)
    analysis_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    resume: Mapped[Resume] = relationship(back_populates="analyses")


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    user: Mapped[User] = relationship(back_populates="jobs")
    matches: Mapped[list["JobMatch"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[str | None] = mapped_column(String(255), index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), default="Remote / Flexible")
    employment_type: Mapped[str] = mapped_column(String(100), default="Full-time")
    experience_required: Mapped[str | None] = mapped_column(String(100))
    salary: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    posted_at: Mapped[str | None] = mapped_column(String(100))
    source_logo: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    saved_entries: Mapped[list["SavedJob"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_user_saved_job"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="saved_jobs")
    job: Mapped[Job] = relationship(back_populates="saved_entries")


class JobMatch(Base):
    __tablename__ = "job_matches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("job_descriptions.id", ondelete="CASCADE"), index=True)
    normalized_job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    matched_skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    partially_matched_skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    missing_skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    matched_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    missing_keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    recommendations: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    explanation: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    analysis_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    resume: Mapped[Resume] = relationship(back_populates="matches")
    job: Mapped[JobDescription | None] = relationship(back_populates="matches")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_user_job_application"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="Interested", nullable=False)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="applications")
    job: Mapped[Job] = relationship(back_populates="applications")


