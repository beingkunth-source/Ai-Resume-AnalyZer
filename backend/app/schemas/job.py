from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class JobDescriptionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    description: str = Field(min_length=30, max_length=50000)


class JobDescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    company: str | None
    description: str
    created_at: datetime


class JobDescriptionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    company: str | None
    created_at: datetime


class NormalizedJob(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str | int
    source: str
    title: str
    company: str
    location: str = "Remote / Flexible"
    employment_type: str = "Full-time"
    experience_required: str | None = None
    salary: str | None = None
    description: str
    skills: list[str] = Field(default_factory=list)
    url: str
    posted_at: str | None = None
    source_logo: str | None = None


class CandidateProfile(BaseModel):
    target_roles: list[str] = Field(default_factory=list)
    technical_skills: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    programming_languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    databases: list[str] = Field(default_factory=list)
    cloud_technologies: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    degree: str | None = None
    experience_level: str = "Entry Level"
    years_of_experience: float = 0.0
    internship_experience: bool = False
    project_experience: bool = False
    certifications: list[str] = Field(default_factory=list)
    preferred_industries: list[str] = Field(default_factory=list)
    location_preferences: list[str] = Field(default_factory=list)
    work_mode_preference: str = "Flexible"


class JobMatchExplanation(BaseModel):
    match_score: float
    reason: str
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    recommendation: str = "Consider Applying"
    sub_scores: dict[str, float] = Field(default_factory=dict)


class RecommendedJobOut(BaseModel):
    job: NormalizedJob
    match_score: float
    category: str  # "BEST MATCHES", "GOOD MATCHES", "POTENTIAL MATCHES"
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    explanation: JobMatchExplanation | None = None
    is_saved: bool = False
    application_status: str | None = None


class JobSearchResponse(BaseModel):
    results: list[RecommendedJobOut]
    total: int
    page: int
    limit: int
    providers_status: dict[str, str] = Field(default_factory=dict)
    candidate_profile: CandidateProfile | None = None


class JobMatchRequest(BaseModel):
    resume_id: int = Field(gt=0)
    job_id: str | int | None = None
    job_object: NormalizedJob | None = None


class JobMatchOut(BaseModel):
    id: int | None = None
    job_id: str | int | None = None
    resume_id: int
    match_score: float = 0.0
    job_match_score: float = 0.0
    matched_skills: list[str] = Field(default_factory=list)
    partially_matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    explanation: JobMatchExplanation | None = None
    strengths_for_this_job: list[str] = Field(default_factory=list)
    gaps_for_this_job: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    semantic_similarity: float | None = None
    created_at: datetime | None = None

