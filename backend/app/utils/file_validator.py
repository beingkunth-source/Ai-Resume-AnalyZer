from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    ".pdf": {"application/pdf", "application/x-pdf", "application/octet-stream"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/octet-stream",
    },
}


@dataclass(frozen=True)
class ValidatedFile:
    suffix: str
    filename: str
    content: bytes


async def validate_upload(file: UploadFile) -> ValidatedFile:
    """Read at most the configured size plus one byte and verify declared + file signatures."""
    settings = get_settings()
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required")
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    if file.content_type not in ALLOWED_MIME_TYPES[suffix]:
        raise HTTPException(status_code=400, detail="File MIME type does not match a supported resume format")

    content = await file.read(settings.max_upload_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds upload size limit")
    if suffix == ".pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="File content is not a valid PDF")
    # DOCX is a ZIP package. A full parser pass is still performed before persistence.
    if suffix == ".docx" and not content.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="File content is not a valid DOCX")
    return ValidatedFile(suffix=suffix, filename=f"{uuid4().hex}{suffix}", content=content)
