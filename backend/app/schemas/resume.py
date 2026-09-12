from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    created_at: datetime
    text_length: int


class ResumeUploadOut(BaseModel):
    id: int
    filename: str
    status: str = "uploaded"
    text_length: int
