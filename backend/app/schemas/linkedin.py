from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class LinkedInAnalyzeRequest(BaseModel):
    linkedin_url: str | None = None
    profile_url: str | None = None
    raw_text: str | None = None
    profile_text: str | None = None


class LinkedInProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    profile_url: str | None = None
    overall_score: float
    headline_score: float
    about_score: float
    experience_score: float
    skills_score: float
    keywords_score: float
    completeness_score: float
    headline: str | None = None
    about: str | None = None
    suggested_headline: str | None = None
    suggested_about: str | None = None
    analysis_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
