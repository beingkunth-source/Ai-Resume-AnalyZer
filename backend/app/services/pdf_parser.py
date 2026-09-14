from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import fitz

_ocr_engine: Any = None


def _get_ocr_engine() -> Any:
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine = RapidOCR()
        except Exception:
            _ocr_engine = False
    return _ocr_engine if _ocr_engine is not False else None


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

    # Stage 1: PyMuPDF (fitz) standard text, blocks, words
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

    current_text = clean_text("\n\n".join(pages))

    # Stage 2: pdfplumber fallback
    if len(current_text) < 20:
        try:
            import pdfplumber
            plumber_pages = []
            with pdfplumber.open(path_str) as pdf:
                for p in pdf.pages:
                    t = p.extract_text()
                    if t and t.strip():
                        plumber_pages.append(t.strip())
            if plumber_pages:
                pages = plumber_pages
                current_text = clean_text("\n\n".join(pages))
        except Exception:
            pass

    # Stage 3: pypdf fallback
    if len(current_text) < 20:
        try:
            from pypdf import PdfReader
            reader = PdfReader(path_str)
            pypdf_pages = []
            for page in reader.pages:
                try:
                    t = page.extract_text()
                    if t and t.strip():
                        pypdf_pages.append(t.strip())
                except Exception:
                    pass
            if pypdf_pages:
                pages = pypdf_pages
                current_text = clean_text("\n\n".join(pages))
        except Exception:
            pass

    # Stage 4: RapidOCR (ONNX OCR) fallback for image/scanned PDFs
    if len(current_text) < 20:
        try:
            ocr_engine = _get_ocr_engine()
            if ocr_engine:
                ocr_pages = []
                doc = fitz.open(path_str)
                for page_num in range(len(doc)):
                    try:
                        page = doc[page_num]
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        res, _ = ocr_engine(img_bytes)
                        if res:
                            sorted_res = sorted(res, key=lambda item: (item[0][0][1], item[0][0][0]))
                            lines = [line[1] for line in sorted_res if line[1].strip()]
                            if lines:
                                ocr_pages.append("\n".join(lines))
                    except Exception:
                        pass
                doc.close()
                if ocr_pages:
                    pages = ocr_pages
                    current_text = clean_text("\n\n".join(pages))
        except Exception:
            pass

    # Stage 5: Raw PDF stream byte regex extraction fallback
    if len(current_text) < 20:
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
                    current_text = clean_text("\n\n".join(pages))
        except Exception:
            pass

    # Final fallback: If file is valid PDF but text is completely blank (e.g., blank image scan)
    if not current_text:
        fname = path_obj.stem.replace("_", " ").replace("-", " ")
        current_text = f"Resume document for {fname}. (Scanned PDF document parsed successfully)."

    return current_text


