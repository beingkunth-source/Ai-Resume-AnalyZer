from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ProfileCreateOrUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    headline: str | None = None
    location: str | None = None
    phone: str | None = None
    portfolio_url: str | None = None
    website_url: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    current_status: str = "Working Professional"
    user_goals: list[str] = Field(default_factory=list)
    target_roles: list[str] = Field(default_factory=list)
    work_mode: str = "Any"
    location_preferences: list[str] = Field(default_factory=list)
    has_existing_resume: bool = False
    has_completed_onboarding: bool = False
    profile_json: dict[str, Any] = Field(default_factory=dict)


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    first_name: str
    last_name: str
    headline: str | None = None
    location: str | None = None
    phone: str | None = None
    portfolio_url: str | None = None
    website_url: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    current_status: str
    user_goals: list[str]
    target_roles: list[str]
    work_mode: str
    location_preferences: list[str]
    has_existing_resume: bool
    has_completed_onboarding: bool
    completion_percentage: float = 0.0
    profile_json: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
