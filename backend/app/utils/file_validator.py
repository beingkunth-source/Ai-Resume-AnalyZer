from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    ".pdf": {
        "application/pdf",
        "application/x-pdf",
        "application/acrobat",
        "applications/vnd.pdf",
        "text/pdf",
        "text/x-pdf",
        "application/octet-stream",
        "binary/octet-stream",
        "application/x-download",
    },
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/wps-office.docx",
        "application/x-docx",
        "application/msword",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
        "binary/octet-stream",
    },
}


@dataclass(frozen=True)
class ValidatedFile:
    suffix: str
    filename: str
    content: bytes


async def validate_upload(file: UploadFile) -> ValidatedFile:
    """Read at most the configured size plus one byte and verify file signatures."""
    settings = get_settings()
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required")
    
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    content_type = (file.content_type or "").split(";")[0].strip().lower()

    content = await file.read(settings.max_upload_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds upload size limit")

    if suffix == ".pdf":
        is_pdf_header = content.startswith(b"%PDF-") or b"%PDF-" in content[:4096]
        if not is_pdf_header and content_type not in ALLOWED_MIME_TYPES[".pdf"] and not content_type.startswith("application/"):
            raise HTTPException(status_code=400, detail="File content is not a valid PDF")

    elif suffix == ".docx":
        is_docx_header = content.startswith(b"PK\x03\x04")
        if not is_docx_header and content_type not in ALLOWED_MIME_TYPES[".docx"]:
            raise HTTPException(status_code=400, detail="File content is not a valid DOCX document")

    return ValidatedFile(suffix=suffix, filename=f"{uuid4().hex}{suffix}", content=content)

