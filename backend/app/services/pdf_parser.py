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
    path_obj = Path(path)
    path_str = str(path_obj)
    pages: list[str] = []

    # Stage 1: PyMuPDF (fitz) with auto-decryption and per-page safety
    try:
        doc = fitz.open(path_str)
        if doc.is_encrypted:
            try:
                doc.authenticate("")
            except Exception:
                pass

        for page_num in range(len(doc)):
            page_text = ""
            try:
                page = doc[page_num]
                page_text = page.get_text("text") or ""
                
                if not page_text or not page_text.strip():
                    blocks = page.get_text("blocks")
                    if isinstance(blocks, list):
                        page_text = "\n".join(b[4] for b in blocks if len(b) > 4 and isinstance(b[4], str))

                if not page_text or not page_text.strip():
                    words = page.get_text("words")
                    if isinstance(words, list):
                        page_text = " ".join(w[4] for w in words if len(w) > 4 and isinstance(w[4], str))
            except Exception:
                pass

            if page_text and page_text.strip():
                pages.append(page_text)

        doc.close()
    except Exception:
        pass

    # Stage 2: pypdf fallback if PyMuPDF failed or extracted no text
    if not pages:
        try:
            from pypdf import PdfReader
            reader = PdfReader(path_str)
            for page in reader.pages:
                try:
                    t = page.extract_text()
                    if t and t.strip():
                        pages.append(t)
                except Exception:
                    pass
        except Exception:
            pass

    # Stage 3: Raw PDF stream byte regex extraction fallback
    if not pages:
        try:
            raw_bytes = path_obj.read_bytes()
            text_matches = re.findall(rb"\(([^()]{2,})\)\s*Tj", raw_bytes)
            if not text_matches:
                text_matches = re.findall(rb"\[\s*\(([^()]{2,})\)\s*\]\s*TJ", raw_bytes)
            if text_matches:
                decoded_strings = []
                for b in text_matches:
                    try:
                        decoded_strings.append(b.decode("utf-8", errors="ignore"))
                    except Exception:
                        pass
                if decoded_strings:
                    pages.append(" ".join(decoded_strings))
        except Exception:
            pass

    text = clean_text("\n\n".join(pages))

    if not text:
        raise TextExtractionError(
            "No extractable text was found in this PDF file. If this is a scanned image or photo PDF, please export it as a text-based PDF or Word document."
        )

    return text

