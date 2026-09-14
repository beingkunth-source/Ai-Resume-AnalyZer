from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class GitHubAnalyzeRequest(BaseModel):
    username_or_url: str = Field(min_length=1)


class GitHubProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    repo_name: str
    repo_url: str
    description: str | None = None
    language: str | None = None
    stars_count: int = 0
    topics: list[str] = Field(default_factory=list)
    generated_resume_bullet: str | None = None
    is_selected_for_resume: bool = False


class GitHubProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    username: str | None = None
    profile_url: str | None = None
    overall_score: float
    top_languages: list[str] = Field(default_factory=list)
    top_technologies: list[str] = Field(default_factory=list)
    analysis_json: dict[str, Any] = Field(default_factory=dict)
    projects: list[GitHubProjectOut] = Field(default_factory=list)
    created_at: datetime


class GitHubProjectImportRequest(BaseModel):
    project_ids: list[int] = Field(default_factory=list)
