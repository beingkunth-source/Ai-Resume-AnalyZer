from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class Scores(BaseModel):
    overall: float = Field(ge=0, le=100)
    ats: float = Field(ge=0, le=100)
    skills: float = Field(ge=0, le=100)
    experience: float = Field(ge=0, le=100)
    education: float = Field(ge=0, le=100)
    projects: float = Field(ge=0, le=100)
    formatting: float = Field(ge=0, le=100)
    keywords: float = Field(ge=0, le=100)
    impact: float = Field(ge=0, le=100)


class Weakness(BaseModel):
    problem: str
    why_it_matters: str
    recommendation: str
    improved_example: str | None = None


class AIAnalysis(BaseModel):
    """Strict, persisted shape expected from the AI provider."""
    candidate_information: dict[str, Any] = Field(default_factory=dict)
    scores: Scores
    technical_skills: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    links: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[Weakness] = Field(default_factory=list)
    missing_sections: list[str] = Field(default_factory=list)
    formatting_issues: list[str] = Field(default_factory=list)
    grammar_issues: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class AnalysisOut(AIAnalysis):
    id: int
    resume_id: int
    created_at: datetime
    ats_checks: dict[str, bool] = Field(default_factory=dict)
    ats_issues: list[str] = Field(default_factory=list)
    ats_recommendations: list[str] = Field(default_factory=list)


class AnalysisListItem(BaseModel):
    id: int
    resume_id: int
    overall_score: float
    ats_score: float
    created_at: datetime
