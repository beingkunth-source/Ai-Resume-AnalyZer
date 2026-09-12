from datetime import datetime
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


class JobMatchRequest(BaseModel):
    resume_id: int = Field(gt=0)
    job_id: int = Field(gt=0)


class JobMatchOut(BaseModel):
    id: int
    job_id: int
    resume_id: int
    job_match_score: float
    matched_skills: list[str]
    partially_matched_skills: list[str]
    missing_skills: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]
    strengths_for_this_job: list[str]
    gaps_for_this_job: list[str]
    recommendations: list[str]
    semantic_similarity: float | None = None
    created_at: datetime
