from __future__ import annotations

import os
import logging
from pathlib import Path
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Template Color Schemes
COLOR_PALETTES = {
    "modern": {"primary": RGBColor(5, 150, 105), "secondary": RGBColor(71, 85, 105), "dark": RGBColor(24, 24, 27)},
    "minimal": {"primary": RGBColor(24, 24, 27), "secondary": RGBColor(113, 113, 122), "dark": RGBColor(9, 9, 11)},
    "creative": {"primary": RGBColor(79, 70, 229), "secondary": RGBColor(109, 40, 217), "dark": RGBColor(15, 23, 42)},
    "classic": {"primary": RGBColor(30, 41, 59), "secondary": RGBColor(100, 116, 139), "dark": RGBColor(15, 23, 42)},
}


def add_bottom_border(paragraph, color_hex="059669"):
    """Add a colored bottom border line under heading paragraphs."""
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '12')
    bottom.set(qn('w:space'), '4')
    bottom.set(qn('w:color'), color_hex)
    pBdr.append(bottom)
    pPr.append(pBdr)


def generate_docx_resume(payload: dict, template_id: str = "modern", photo_path: str | None = None) -> str:
    """Generate a professionally styled Microsoft Word (.docx) resume."""
    settings = get_settings()
    os.makedirs(settings.uploads_dir, exist_ok=True)

    doc = Document()

    # Set 0.75-inch page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.65)
        section.bottom_margin = Inches(0.65)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    palette = COLOR_PALETTES.get(template_id, COLOR_PALETTES["modern"])
    color_hex = "059669" if template_id == "modern" else "4F46E5" if template_id == "creative" else "18181B"

    personal_info = payload.get("personal_info", {})
    name = personal_info.get("name", "CANDIDATE NAME").upper()
    headline = personal_info.get("headline", "")
    email = personal_info.get("email", "")
    phone = personal_info.get("phone", "")
    location = personal_info.get("location", "")
    linkedin = personal_info.get("linkedin", "")
    github = personal_info.get("github", "")

    # Candidate Header Section (Table layout if photo is present)
    if photo_path and os.path.exists(photo_path):
        table = doc.add_table(rows=1, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        cell_photo, cell_text = table.rows[0].cells
        cell_photo.width = Inches(1.3)
        cell_text.width = Inches(5.7)

        # Remove borders
        for cell in (cell_photo, cell_text):
            tcPr = cell._tc.get_or_add_tcPr()
            tcBorders = parse_xml(r'<w:tcBorders %s><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>' % nsdecls('w'))
            tcPr.append(tcBorders)

        p_img = cell_photo.paragraphs[0]
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        try:
            p_img.add_run().add_picture(photo_path, width=Inches(1.15))
        except Exception as e:
            logger.warning(f"Could not attach profile image to DOCX: {e}")

        p_name = cell_text.paragraphs[0]
    else:
        p_name = doc.add_paragraph()

    run_name = p_name.add_run(name)
    run_name.font.name = "Calibri"
    run_name.font.size = Pt(22)
    run_name.font.bold = True
    run_name.font.color.rgb = palette["primary"]

    if headline:
        p_head = doc.add_paragraph() if photo_path else cell_text.add_paragraph()
        run_head = p_head.add_run(headline)
        run_head.font.name = "Calibri"
        run_head.font.size = Pt(12)
        run_head.font.bold = True
        run_head.font.color.rgb = palette["secondary"]

    # Contact Info Line
    contact_parts = [c for c in [email, phone, location, linkedin, github] if c]
    if contact_parts:
        p_contact = doc.add_paragraph() if photo_path else cell_text.add_paragraph()
        run_contact = p_contact.add_run(" | ".join(contact_parts))
        run_contact.font.name = "Calibri"
        run_contact.font.size = Pt(9.5)
        run_contact.font.color.rgb = palette["secondary"]

    doc.add_paragraph()

    # Section Helper
    def add_section_header(title: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title.upper())
        run.font.name = "Calibri"
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = palette["primary"]
        add_bottom_border(p, color_hex=color_hex)

    # 1. Professional Summary
    summary = payload.get("summary", "")
    if summary:
        add_section_header("Professional Summary")
        p_sum = doc.add_paragraph()
        p_sum.paragraph_format.space_after = Pt(6)
        r_sum = p_sum.add_run(summary)
        r_sum.font.name = "Calibri"
        r_sum.font.size = Pt(10.5)
        r_sum.font.color.rgb = palette["dark"]

    # 2. Work Experience
    experience = payload.get("experience", [])
    if experience:
        add_section_header("Work Experience")
        for exp in experience:
            p_exp = doc.add_paragraph()
            p_exp.paragraph_format.space_before = Pt(6)
            p_exp.paragraph_format.space_after = Pt(2)
            
            r_title = p_exp.add_run(f"{exp.get('title', 'Role')} ")
            r_title.font.name = "Calibri"
            r_title.font.size = Pt(11)
            r_title.font.bold = True
            r_title.font.color.rgb = palette["dark"]

            r_comp = p_exp.add_run(f"| {exp.get('company', 'Company')} ")
            r_comp.font.name = "Calibri"
            r_comp.font.size = Pt(10.5)
            r_comp.font.italic = True

            if exp.get("dates"):
                r_date = p_exp.add_run(f"({exp.get('dates')})")
                r_date.font.name = "Calibri"
                r_date.font.size = Pt(9.5)
                r_date.font.color.rgb = palette["secondary"]

            desc = exp.get("description", "")
            if desc:
                for bullet in desc.split("\n"):
                    b_clean = bullet.strip().lstrip("• ")
                    if b_clean:
                        p_b = doc.add_paragraph(style="List Bullet")
                        p_b.paragraph_format.space_after = Pt(2)
                        r_b = p_b.add_run(b_clean)
                        r_b.font.name = "Calibri"
                        r_b.font.size = Pt(10)
                        r_b.font.color.rgb = palette["dark"]

    # 3. Key Projects
    projects = payload.get("projects", [])
    if projects:
        add_section_header("Key Projects & Open Source")
        for proj in projects:
            p_proj = doc.add_paragraph()
            p_proj.paragraph_format.space_before = Pt(6)
            p_proj.paragraph_format.space_after = Pt(2)

            r_name = p_proj.add_run(f"{proj.get('name', 'Project')} ")
            r_name.font.name = "Calibri"
            r_name.font.size = Pt(11)
            r_name.font.bold = True
            r_name.font.color.rgb = palette["dark"]

            tech_stack = proj.get("tech_stack", [])
            if tech_stack:
                r_tech = p_proj.add_run(f"[{', '.join(tech_stack)}] ")
                r_tech.font.name = "Calibri"
                r_tech.font.size = Pt(9.5)
                r_tech.font.bold = True
                r_tech.font.color.rgb = palette["primary"]

            if proj.get("url"):
                r_url = p_proj.add_run(f"- {proj.get('url')}")
                r_url.font.name = "Calibri"
                r_url.font.size = Pt(9.5)
                r_url.font.color.rgb = palette["secondary"]

            key_points = proj.get("key_points", [])
            for kp in key_points:
                kp_clean = kp.strip().lstrip("• ")
                if kp_clean:
                    p_kp = doc.add_paragraph(style="List Bullet")
                    p_kp.paragraph_format.space_after = Pt(2)
                    r_kp = p_kp.add_run(kp_clean)
                    r_kp.font.name = "Calibri"
                    r_kp.font.size = Pt(10)

    # 4. Education
    education = payload.get("education", [])
    if education:
        add_section_header("Education")
        for edu in education:
            p_edu = doc.add_paragraph()
            p_edu.paragraph_format.space_after = Pt(3)

            r_deg = p_edu.add_run(f"{edu.get('degree', 'Degree')}, ")
            r_deg.font.name = "Calibri"
            r_deg.font.size = Pt(10.5)
            r_deg.font.bold = True

            r_inst = p_edu.add_run(f"{edu.get('institution', 'University')} ")
            r_inst.font.name = "Calibri"
            r_inst.font.size = Pt(10.5)

            if edu.get("dates"):
                r_edate = p_edu.add_run(f"({edu.get('dates')})")
                r_edate.font.name = "Calibri"
                r_edate.font.size = Pt(9.5)
                r_edate.font.color.rgb = palette["secondary"]

    # 5. Technical Skills
    skills = payload.get("skills", [])
    if skills:
        add_section_header("Technical Skills & Competencies")
        p_skills = doc.add_paragraph()
        r_skills = p_skills.add_run(", ".join(skills))
        r_skills.font.name = "Calibri"
        r_skills.font.size = Pt(10.5)
        r_skills.font.color.rgb = palette["dark"]

    # Save to file
    safe_name = name.replace(" ", "_") or "Candidate"
    filename = f"{safe_name}_{template_id}_Resume.docx"
    file_path = os.path.join(settings.uploads_dir, filename)
    doc.save(file_path)

    return file_path
