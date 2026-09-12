from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    """Runtime configuration. Environment variables always take precedence."""

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    app_name: str = "AI Resume Analyzer"
    environment: str = "development"
    database_url: str = "sqlite:///./resume_analyzer.db"
    supabase_url: str | None = None
    supabase_key: str | None = None
    supabase_service_role_key: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    jwt_secret_key: str = "change-this-development-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, gt=0)
    frontend_url: str = "http://localhost:5173"
    cors_origins: str | None = None
    max_upload_size_mb: int = Field(default=5, ge=1, le=25)
    uploads_dir: Path = BASE_DIR / "uploads"
    openai_timeout_seconds: float = Field(default=30.0, gt=0)
    skill_match_weight: float = 0.4
    keyword_match_weight: float = 0.2
    semantic_match_weight: float = 0.2
    experience_match_weight: float = 0.1
    education_match_weight: float = 0.1

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Render sometimes exposes the legacy postgres:// form.
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins or self.frontend_url
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
