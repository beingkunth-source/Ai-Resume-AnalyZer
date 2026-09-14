from __future__ import annotations

import os
from pathlib import Path
from typing import Any
import fitz

from app.core.config import get_settings


def parse_hex_color(hex_str: str | None) -> tuple[float, float, float]:
    """Converts hex color (e.g. #059669) to PyMuPDF RGB float tuple (0.0 to 1.0)."""
    if not hex_str or not hex_str.startswith("#") or len(hex_str) < 7:
        return (0.02, 0.59, 0.41)  # Emerald default
    try:
        r = int(hex_str[1:3], 16) / 255.0
        g = int(hex_str[3:5], 16) / 255.0
        b = int(hex_str[5:7], 16) / 255.0
        return (r, g, b)
    except Exception:
        return (0.02, 0.59, 0.41)


def generate_pdf_resume(resume_data: dict[str, Any], template_id: str = "modern", primary_color: str | None = None) -> str:
    """Generates a professional PDF resume document using PyMuPDF and returns the file path."""
    settings = get_settings()
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)

    name = resume_data.get("name") or (resume_data.get("personal_info") or {}).get("name") or "Resume"
    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
    output_filename = f"{safe_name}_Resume_{template_id}.pdf"
    file_path = settings.uploads_dir / output_filename

    doc = fitz.open()
    page = doc.new_page(pno=-1, width=595, height=842)  # A4 standard points: 595 x 842
    
    margin_x = 45
    current_y = 45
    max_width = 505
    rgb_primary = parse_hex_color(primary_color or "#059669")
    rgb_dark = (0.06, 0.09, 0.16)
    rgb_gray = (0.39, 0.45, 0.55)

    # 1. Header Section
    headline = resume_data.get("headline") or (resume_data.get("personal_info") or {}).get("headline") or ""
    email = resume_data.get("email") or (resume_data.get("personal_info") or {}).get("email") or ""
    phone = resume_data.get("phone") or (resume_data.get("personal_info") or {}).get("phone") or ""
    location = resume_data.get("location") or (resume_data.get("personal_info") or {}).get("location") or ""
    linkedin = resume_data.get("linkedin") or (resume_data.get("personal_info") or {}).get("linkedin_url") or ""
    github = resume_data.get("github") or (resume_data.get("personal_info") or {}).get("github_url") or ""

    # Header Variations based on template_id
    if template_id in ("modern", "executive"):
        header_rect = fitz.Rect(0, 0, 595, 95)
        page.draw_rect(header_rect, color=rgb_primary, fill=rgb_primary)
        
        page.insert_text((margin_x, 38), name.upper(), fontsize=20, fontname="helv", color=(1.0, 1.0, 1.0))
        if headline:
            page.insert_text((margin_x, 56), headline, fontsize=10.5, fontname="helv", color=(0.95, 0.97, 1.0))
        
        contact_parts = [p for p in [email, phone, location, linkedin, github] if p]
        if contact_parts:
            contact_str = "  •  ".join(contact_parts)
            page.insert_text((margin_x, 74), contact_str[:110], fontsize=8.5, fontname="helv", color=(0.9, 0.93, 0.98))
        current_y = 115
    else:
        if template_id == "minimal":
            page.draw_line(fitz.Point(32, 40), fitz.Point(32, 800), color=rgb_primary, width=4.0)

        # Name
        page.insert_text((margin_x, current_y), name, fontsize=20, fontname="helv", color=rgb_primary)
        current_y += 24

        # Headline
        if headline:
            page.insert_text((margin_x, current_y), headline, fontsize=11, fontname="helv", color=rgb_dark)
            current_y += 16

        # Contact line
        contact_parts = [p for p in [email, phone, location, linkedin, github] if p]
        if contact_parts:
            contact_str = "  •  ".join(contact_parts)
            page.insert_text((margin_x, current_y), contact_str[:110], fontsize=8.5, fontname="helv", color=rgb_gray)
            current_y += 18

        # Accent Divider Line
        page.draw_line(fitz.Point(margin_x, current_y), fitz.Point(margin_x + max_width, current_y), color=rgb_primary, width=1.5)
        current_y += 16

    def add_section_header(title: str):
        nonlocal current_y
        if current_y > 770:
            nonlocal page
            page = doc.new_page(pno=-1, width=595, height=842)
            current_y = 45
        page.insert_text((margin_x, current_y), title.upper(), fontsize=10, fontname="helv", color=rgb_primary)
        current_y += 12
        page.draw_line(fitz.Point(margin_x, current_y), fitz.Point(margin_x + max_width, current_y), color=(0.88, 0.91, 0.94), width=0.75)
        current_y += 12

    # 2. Professional Summary
    summary = resume_data.get("summary")
    if summary:
        add_section_header("Professional Summary")
        rect = fitz.Rect(margin_x, current_y, margin_x + max_width, current_y + 80)
        rc = page.insert_textbox(rect, summary, fontsize=9, fontname="helv", color=rgb_dark, align=0)
        if rc > 0:
            current_y += max(35, 80 - rc) + 12
        else:
            current_y += 45

    # 3. Technical Skills
    skills = resume_data.get("skills") or resume_data.get("technical_skills")
    if skills:
        add_section_header("Technical Skills & Core Competencies")
        skills_str = ", ".join(skills) if isinstance(skills, list) else str(skills)
        rect = fitz.Rect(margin_x, current_y, margin_x + max_width, current_y + 40)
        rc = page.insert_textbox(rect, skills_str, fontsize=9, fontname="helv", color=rgb_dark)
        current_y += 24

    # 4. Work Experience
    experience = resume_data.get("experience")
    if isinstance(experience, list) and experience:
        add_section_header("Work Experience")
        for exp in experience:
            if current_y > 760:
                page = doc.new_page(pno=-1, width=595, height=842)
                current_y = 45
            
            title = exp.get("title") or exp.get("role") or "Software Developer"
            company = exp.get("company") or ""
            dates = exp.get("dates") or exp.get("duration") or ""
            
            page.insert_text((margin_x, current_y), f"{title}", fontsize=10, fontname="helv", color=rgb_dark)
            if dates:
                page.insert_text((margin_x + max_width - 110, current_y), dates, fontsize=8.5, fontname="helv", color=rgb_gray)
            current_y += 13

            if company:
                page.insert_text((margin_x, current_y), company, fontsize=9, fontname="helv", color=rgb_primary)
                current_y += 14

            bullets = exp.get("bullets") or ([exp.get("description")] if exp.get("description") else [])
            for b in bullets:
                if not b:
                    continue
                if current_y > 770:
                    page = doc.new_page(pno=-1, width=595, height=842)
                    current_y = 45
                rect = fitz.Rect(margin_x + 10, current_y, margin_x + max_width, current_y + 35)
                rc = page.insert_textbox(rect, f"• {b}", fontsize=8.5, fontname="helv", color=rgb_dark)
                current_y += 14
            current_y += 6

    # 5. Technical Projects
    projects = resume_data.get("projects")
    if isinstance(projects, list) and projects:
        add_section_header("Technical Projects")
        for proj in projects:
            if current_y > 760:
                page = doc.new_page(pno=-1, width=595, height=842)
                current_y = 45
            p_title = proj.get("title") or proj.get("name") or "Project"
            tech = proj.get("technologies") or ""
            if isinstance(tech, list):
                tech = ", ".join(tech)

            page.insert_text((margin_x, current_y), p_title, fontsize=9.5, fontname="helv", color=rgb_dark)
            current_y += 13
            if tech:
                page.insert_text((margin_x, current_y), f"Technologies: {tech}", fontsize=8, fontname="helv", color=rgb_gray)
                current_y += 12

            p_bullets = proj.get("bullets") or ([proj.get("description")] if proj.get("description") else [])
            for pb in p_bullets:
                if not pb:
                    continue
                if current_y > 770:
                    page = doc.new_page(pno=-1, width=595, height=842)
                    current_y = 45
                rect = fitz.Rect(margin_x + 10, current_y, margin_x + max_width, current_y + 35)
                page.insert_textbox(rect, f"• {pb}", fontsize=8.5, fontname="helv", color=rgb_dark)
                current_y += 14
            current_y += 6

    # 6. Education
    education = resume_data.get("education")
    if isinstance(education, list) and education:
        add_section_header("Education & Credentials")
        for edu in education:
            if current_y > 770:
                page = doc.new_page(pno=-1, width=595, height=842)
                current_y = 45
            deg = edu.get("degree") or ""
            inst = edu.get("institution") or ""
            year = edu.get("year") or edu.get("dates") or ""
            page.insert_text((margin_x, current_y), f"{deg} — {inst}", fontsize=9, fontname="helv", color=rgb_dark)
            if year:
                page.insert_text((margin_x + max_width - 80, current_y), year, fontsize=8.5, fontname="helv", color=rgb_gray)
            current_y += 15

    doc.save(str(file_path))
    doc.close()
    return str(file_path)
