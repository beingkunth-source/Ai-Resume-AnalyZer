from __future__ import annotations

import re
from pathlib import Path

import fitz


class TextExtractionError(ValueError):
    pass


def clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pdf_text(path: str | Path) -> str:
    try:
        with fitz.open(path) as document:
            pages = []
            for page in document:
                page_text = page.get_text("text")
                if not page_text or not page_text.strip():
                    # Fallback to block extraction if standard page text is sparse
                    try:
                        blocks = page.get_text("blocks")
                        if isinstance(blocks, list):
                            page_text = "\n".join(b[4] for b in blocks if len(b) > 4 and isinstance(b[4], str))
                    except Exception:
                        pass
                if page_text and page_text.strip():
                    pages.append(page_text)
    except (fitz.FileDataError, RuntimeError) as exc:
        raise TextExtractionError("The PDF could not be opened or read") from exc

    text = clean_text("\n\n".join(pages))

    if not text:
        raise TextExtractionError(
            "No extractable text was found in this PDF file. If this is a scanned image or photo PDF, please export it as a text-based document."
        )

    return text
