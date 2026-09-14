from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.job import NormalizedJob


class ApplicationCreate(BaseModel):
    job_id: int = Field(gt=0)
    status: str = Field(default="Interested")
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    job_id: int
    status: str
    applied_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    job: NormalizedJob | None = None
