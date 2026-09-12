from pathlib import Path

from app.services.docx_parser import extract_docx_text
from app.services.pdf_parser import extract_pdf_text


def extract_resume_text(path: str | Path) -> str:
    suffix = Path(path).suffix.lower()
    if suffix == ".pdf":
        return extract_pdf_text(path)
    if suffix == ".docx":
        return extract_docx_text(path)
    raise ValueError("Unsupported resume file type")
