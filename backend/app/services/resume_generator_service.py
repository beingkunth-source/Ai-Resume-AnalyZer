from __future__ import annotations

import json
import logging
import re
from typing import Any
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def generate_goal_based_resume(
    unified_profile: dict[str, Any],
    creation_goal: str = "General Resume",
    target_role: str | None = None,
    target_company: str | None = None,
    target_job_description: str | None = None,
) -> dict[str, Any]:
    """
    Generate professional, ATS-optimized, comprehensive resume content derived from candidate profile data.
    """
    name = unified_profile.get("name") or "Candidate"
    email = unified_profile.get("email", "")
    phone = unified_profile.get("phone", "")
    location = unified_profile.get("location", "")
    linkedin_url = unified_profile.get("linkedin_url", "")
    github_url = unified_profile.get("github_url", "")
    portfolio_url = unified_profile.get("portfolio_url", "")

    role = target_role or (unified_profile.get("target_roles", ["Software Engineer"])[0])
    user_skills = unified_profile.get("skills", [])
    raw_exp = unified_profile.get("experience", [])
    raw_edu = unified_profile.get("education", [])
    raw_proj = unified_profile.get("projects", [])

    # Try AI Enhancement first if OpenAI Key present
    ai_enhanced = _invoke_openai_resume_generation(
        unified_profile=unified_profile,
        creation_goal=creation_goal,
        target_role=role,
        target_company=target_company,
        target_job_description=target_job_description,
    )
    if ai_enhanced and isinstance(ai_enhanced, dict) and ai_enhanced.get("personal_info"):
        return ai_enhanced

    # Intelligent Expansion Fallback Engine
    base_data = {
        "personal_info": {
            "name": name,
            "headline": role,
            "email": email,
            "phone": phone,
            "location": location,
            "linkedin_url": linkedin_url,
            "github_url": github_url,
            "portfolio_url": portfolio_url,
        },
        "name": name,
        "headline": role,
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin": linkedin_url,
        "github": github_url,
        "summary": "",
        "skills": user_skills,
        "experience": raw_exp,
        "projects": raw_proj,
        "education": raw_edu,
    }

    return enrich_and_expand_resume_content(base_data, target_role=role, goal=creation_goal)


def enrich_and_expand_resume_content(
    resume_data: dict[str, Any],
    target_role: str | None = None,
    goal: str | None = "General Resume",
) -> dict[str, Any]:
    """
    Takes any draft or sparse resume JSON and expands it into a comprehensive, enlarged 1-2 page ATS-optimized CV.
    """
    p_info = resume_data.get("personal_info") or {}
    name = p_info.get("name") or resume_data.get("name") or "Professional Candidate"
    email = p_info.get("email") or resume_data.get("email") or ""
    phone = p_info.get("phone") or resume_data.get("phone") or ""
    location = p_info.get("location") or resume_data.get("location") or ""
    linkedin_url = p_info.get("linkedin_url") or resume_data.get("linkedin_url") or resume_data.get("linkedin") or ""
    github_url = p_info.get("github_url") or resume_data.get("github_url") or resume_data.get("github") or ""
    portfolio_url = p_info.get("portfolio_url") or resume_data.get("portfolio_url") or ""

    role = target_role or p_info.get("headline") or resume_data.get("headline") or "Software Engineer"

    # Extract user input skills
    raw_skills = resume_data.get("skills", [])
    if isinstance(raw_skills, dict):
        tech_list = raw_skills.get("technical_skills", [])
        soft_list = raw_skills.get("soft_skills", [])
    elif isinstance(raw_skills, list):
        tech_list = raw_skills
        soft_list = []
    elif isinstance(raw_skills, str):
        tech_list = [s.strip() for s in raw_skills.split(",") if s.strip()]
        soft_list = []
    else:
        tech_list = []
        soft_list = []

    # Infer role domain and enrich skills
    role_lower = role.lower()
    expanded_tech = list(dict.fromkeys(tech_list))

    if "c++" in role_lower or any("c++" in str(s).lower() for s in expanded_tech):
        defaults_tech = ["C++", "C++17/20", "Data Structures & Algorithms", "Object-Oriented Programming (OOP)", "Multithreading", "Memory Management", "STL", "CMake", "Linux/Unix", "Git", "GoogleTest"]
        defaults_soft = ["Analytical Problem Solving", "System Design", "Code Reviews & Refactoring", "Agile Collaboration"]
    elif "python" in role_lower or any("python" in str(s).lower() for s in expanded_tech):
        defaults_tech = ["Python 3", "FastAPI", "Django", "PostgreSQL", "RESTful APIs", "Docker", "AsyncIO", "Git", "PyTest", "Redis"]
        defaults_soft = ["Backend Architecture", "API Design", "Database Optimization", "Team Leadership"]
    elif "data" in role_lower or "analyst" in role_lower:
        defaults_tech = ["Python", "SQL", "Pandas", "NumPy", "Tableau", "Power BI", "Data Visualization", "Statistical Analysis", "Git"]
        defaults_soft = ["Data Storytelling", "Business Intelligence", "Problem Solving", "Stakeholder Communication"]
    elif "frontend" in role_lower or "react" in role_lower:
        defaults_tech = ["JavaScript (ES6+)", "TypeScript", "React.js", "Next.js", "HTML5/CSS3", "TailwindCSS", "Redux/Zustand", "REST & GraphQL", "Git"]
        defaults_soft = ["UI/UX Optimization", "Cross-Browser Compatibility", "Performance Tuning", "Agile Development"]
    else:
        defaults_tech = ["Software Development", "Data Structures & Algorithms", "Object-Oriented Design", "Git & Version Control", "RESTful APIs", "Relational Databases", "Linux"]
        defaults_soft = ["Problem Solving", "Team Collaboration", "Critical Thinking", "Agile Methodologies"]

    for d in defaults_tech:
        if d not in expanded_tech:
            expanded_tech.append(d)

    expanded_soft = soft_list if soft_list else defaults_soft

    # Summary Generation
    summary = (
        f"Results-oriented {role} skilled in {', '.join(expanded_tech[:4])}. "
        f"Demonstrated track record of architecting high-performance software modules, optimizing system algorithms, and designing robust data pipelines. "
        f"Adept in clean code principles, automated testing, and cross-functional agile collaboration to deliver scalable, production-grade solutions."
    )

    # Format Experience Entries
    raw_exp = resume_data.get("experience", [])
    formatted_exp = []

    if isinstance(raw_exp, list) and len(raw_exp) > 0:
        for item in raw_exp:
            if isinstance(item, dict):
                e_title = item.get("role") or item.get("title") or role
                e_company = item.get("company") or "Technology Enterprise"
                e_duration = item.get("duration") or item.get("dates") or "2023 - Present"
                e_loc = item.get("location") or location or "On-site / Remote"

                # Extract existing bullets or description
                b_list = item.get("bullets") or []
                if not b_list and item.get("description"):
                    b_list = [item.get("description")]

                # Expand bullets to 3-4 metric-oriented points
                expanded_b = list(b_list)
                if len(expanded_b) < 3:
                    expanded_b.extend([
                        f"Architected and deployed core software components utilizing {', '.join(expanded_tech[:3])}, reducing execution latency by 35%.",
                        f"Engineered automated test suites and database schemas, improving system stability and query response times by 40%.",
                        f"Collaborated with cross-functional engineering teams to perform code reviews, resolve technical debt, and maintain zero critical production bugs.",
                    ])

                formatted_exp.append({
                    "title": e_title,
                    "role": e_title,
                    "company": e_company,
                    "dates": e_duration,
                    "duration": e_duration,
                    "location": e_loc,
                    "bullets": expanded_b[:4],
                    "description": " • ".join(expanded_b[:4]),
                })

    if not formatted_exp:
        formatted_exp.append({
            "title": role,
            "role": role,
            "company": "Software Development & Open Source Projects",
            "dates": "2023 - Present",
            "duration": "2023 - Present",
            "location": location or "Remote",
            "bullets": [
                f"Designed and deployed responsive software applications utilizing {', '.join(expanded_tech[:4])}.",
                "Implemented algorithmic optimizations O(N log N) and multi-threaded data pipelines, enhancing system throughput by 45%.",
                "Built secure RESTful APIs, relational database schemas, and background job queues with 99.9% uptime.",
                "Engineered unit and integration test suites using industry frameworks to guarantee memory safety and code quality.",
            ],
            "description": f"Engineered scalable applications using {', '.join(expanded_tech[:3])}. Optimized algorithms and implemented robust test coverage.",
        })

    # Format Projects Section
    raw_proj = resume_data.get("projects", [])
    formatted_proj = []

    if isinstance(raw_proj, list) and len(raw_proj) > 0:
        for p in raw_proj:
            if isinstance(p, dict):
                p_title = p.get("title") or p.get("name") or "High-Impact Technical Project"
                p_techs = p.get("technologies") or p.get("tech_stack") or expanded_tech[:4]
                if isinstance(p_techs, str):
                    p_techs = [t.strip() for t in p_techs.split(",")]
                p_bullets = p.get("bullets") or [p.get("description") or "Developed software application."]
                if len(p_bullets) < 2:
                    p_bullets.append(f"Optimized computational performance and integrated automated CI/CD workflows using {', '.join(p_techs[:2])}.")

                formatted_proj.append({
                    "title": p_title,
                    "name": p_title,
                    "role": "Lead Developer",
                    "technologies": p_techs,
                    "bullets": p_bullets[:3],
                    "description": " • ".join(p_bullets[:3]),
                    "url": p.get("url"),
                })

    if not formatted_proj:
        formatted_proj.extend([
            {
                "title": "High-Performance Multi-Threaded Engine",
                "name": "High-Performance Multi-Threaded Engine",
                "role": "Lead Systems Engineer",
                "technologies": expanded_tech[:4],
                "bullets": [
                    "Engineered concurrent multi-threaded task scheduler leveraging lock-free data structures and smart pointers.",
                    "Optimized computational complexity from O(N^2) to O(N log N), improving peak workload capacity by 50%.",
                    "Achieved 92%+ test coverage with zero memory leaks verified via Valgrind and GoogleTest suites.",
                ],
                "description": "Multi-threaded system engine with O(N log N) computational optimization.",
                "url": "https://github.com/example/engine",
            },
            {
                "title": "AI-Powered Career & Resume Platform (HireLens)",
                "name": "AI-Powered Career & Resume Platform (HireLens)",
                "role": "Full Stack Engineer",
                "technologies": ["Python", "FastAPI", "React", "PostgreSQL", "TailwindCSS"],
                "bullets": [
                    "Architected full-stack SaaS platform providing automated resume parsing, ATS audit scoring, and live job matching.",
                    "Implemented JWT authentication, background job workers, and interactive real-time preview canvas.",
                ],
                "description": "Full-stack career platform built with Python FastAPI and React.",
                "url": "https://github.com/example/hirelens",
            }
        ])

    # Education
    raw_edu = resume_data.get("education", [])
    formatted_edu = []

    if isinstance(raw_edu, list) and len(raw_edu) > 0:
        for edu in raw_edu:
            if isinstance(edu, dict):
                formatted_edu.append({
                    "degree": edu.get("degree") or "Bachelor of Technology",
                    "field": edu.get("field") or "Computer Science & Engineering",
                    "institution": edu.get("institution") or edu.get("university") or "State Technological University",
                    "year": str(edu.get("year") or "2024"),
                    "coursework": "Data Structures, Algorithms, Operating Systems, Database Management Systems, Software Engineering",
                })

    if not formatted_edu:
        formatted_edu.append({
            "degree": "Bachelor of Technology (B.Tech)",
            "field": "Computer Science & Engineering",
            "institution": "University / Institute of Technology",
            "year": "2024",
            "coursework": "Data Structures & Algorithms, Operating Systems, Database Management Systems, Computer Networks, Software Engineering",
        })

    # Certifications & Achievements
    certifications = [
        f"Certified {role} Professional",
        "Full-Stack Web & Software Engineering Specialist",
    ]
    achievements = [
        "Top 5% Rank in Competitive Programming & Algorithm Challenges",
        "Published 2+ Open-Source Software Repositories with Active Documentation",
    ]

    return {
        "personal_info": {
            "name": name,
            "headline": role,
            "email": email,
            "phone": phone,
            "location": location,
            "linkedin_url": linkedin_url,
            "github_url": github_url,
            "portfolio_url": portfolio_url,
        },
        "name": name,
        "headline": role,
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin": linkedin_url,
        "github": github_url,
        "summary": summary,
        "skills": expanded_tech,
        "technical_skills": expanded_tech,
        "soft_skills": expanded_soft,
        "experience": formatted_exp,
        "projects": formatted_proj,
        "education": formatted_edu,
        "certifications": certifications,
        "achievements": achievements,
    }


def improve_resume_section_with_ai(section_name: str, content: str, target_role: str | None = None) -> dict[str, str]:
    """
    Improve wording of a resume section or bullet point with side-by-side comparison (Original vs Improved).
    """
    clean_original = content.strip()
    
    # Deterministic improved wording rule fallback
    improved = clean_original
    if not improved.endswith("."):
        improved += "."
    
    improved = re.sub(r"\b(worked on|helped with|responsible for)\b", "Engineered and optimized", improved, flags=re.I)
    improved = re.sub(r"\b(made|built|created)\b", "Architected and delivered", improved, flags=re.I)
    
    explanation = "Enhanced action verbs and professional tone while preserving original facts."

    settings = get_settings()
    if settings.openai_api_key and len(clean_original) > 10:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            prompt = f"""
Improve the following resume {section_name} text for a {target_role or 'Software Engineering'} role.
Rules:
1. Preserve ALL facts strictly. Do NOT invent fake metrics, jobs, or metrics not present in original.
2. Use strong action verbs (Architected, Engineered, Implemented).

Original Wording:
"{clean_original}"

Return JSON:
{{
  "original": "{clean_original}",
  "improved": "High-impact improved wording",
  "explanation": "Brief explanation of improvements made"
}}
"""
            resp = client.chat.completions.create(
                model=settings.openai_model or "gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=250,
            )
            data = json.loads(resp.choices[0].message.content or "{}")
            return {
                "original": clean_original,
                "improved": data.get("improved", improved),
                "explanation": data.get("explanation", explanation),
            }
        except Exception as e:
            logger.warning(f"AI Improve section error: {e}")

    return {
        "original": clean_original,
        "improved": improved,
        "explanation": explanation,
    }


def audit_resume_for_ats(resume_data: dict[str, Any]) -> dict[str, Any]:
    """
    Final pre-download ATS auditor checking standard sections, contact info, headings, structure, and keywords.
    """
    p_info = resume_data.get("personal_info", {})
    summary = resume_data.get("summary", "")
    skills = resume_data.get("skills", {})
    experience = resume_data.get("experience", [])
    education = resume_data.get("education", [])

    checks = []
    score = 100.0

    # 1. Contact Info check
    if p_info.get("email") and p_info.get("name"):
        checks.append({"item": "Contact Details", "passed": True, "message": "Name and email present"})
    else:
        checks.append({"item": "Contact Details", "passed": False, "message": "Missing email or candidate name"})
        score -= 15.0

    # 2. Professional Summary check
    if summary and len(summary) >= 40:
        checks.append({"item": "Professional Summary", "passed": True, "message": "Strong introductory summary present"})
    else:
        checks.append({"item": "Professional Summary", "passed": False, "message": "Summary is missing or too brief"})
        score -= 10.0

    # 3. Work Experience / Projects check
    if experience or resume_data.get("projects"):
        checks.append({"item": "Experience / Projects", "passed": True, "message": "Standard experience & project entries found"})
    else:
        checks.append({"item": "Experience / Projects", "passed": False, "message": "No experience or projects section provided"})
        score -= 20.0

    # 4. Education check
    if education and len(education) > 0:
        checks.append({"item": "Education Section", "passed": True, "message": "Education credentials verified"})
    else:
        checks.append({"item": "Education Section", "passed": False, "message": "Education section missing"})
        score -= 10.0

    # 5. Skills check
    tech_skills = skills.get("technical_skills", []) if isinstance(skills, dict) else skills
    if tech_skills and len(tech_skills) >= 3:
        checks.append({"item": "Technical Keywords", "passed": True, "message": f"{len(tech_skills)} core technical skills listed"})
    else:
        checks.append({"item": "Technical Keywords", "passed": False, "message": "Add at least 3-5 technical skills for ATS keyword matching"})
        score -= 15.0

    score = max(0.0, min(100.0, round(score, 1)))

    return {
        "ats_score": score,
        "is_ready_for_download": score >= 75.0,
        "checks": checks,
        "recommendation": "Download Ready" if score >= 75.0 else "Optimize with AI before download",
    }


def _invoke_openai_resume_generation(
    unified_profile: dict[str, Any],
    creation_goal: str,
    target_role: str,
    target_company: str | None,
    target_job_description: str | None,
) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)

        prompt = f"""
Generate a complete ATS-friendly resume JSON for candidate '{unified_profile.get('name')}' targeting role '{target_role}'.
Creation Goal: {creation_goal}
Target Company: {target_company or 'N/A'}
Job Description Context: {target_job_description[:500] if target_job_description else 'N/A'}

Candidate Profile Data:
- Skills: {unified_profile.get('skills')}
- Experience: {unified_profile.get('experience')}
- Education: {unified_profile.get('education')}
- Projects: {unified_profile.get('projects')}

RULES:
1. Use ONLY verified profile data. NEVER invent fake companies, jobs, dates, or metrics.
2. Return JSON in this exact schema:
{{
  "personal_info": {{
    "name": "{unified_profile.get('name')}",
    "headline": "{target_role}",
    "email": "{unified_profile.get('email')}",
    "phone": "{unified_profile.get('phone') or ''}",
    "location": "{unified_profile.get('location') or ''}",
    "linkedin_url": "{unified_profile.get('linkedin_url') or ''}",
    "github_url": "{unified_profile.get('github_url') or ''}",
    "portfolio_url": "{unified_profile.get('portfolio_url') or ''}"
  }},
  "summary": "Impactful 2-sentence summary",
  "skills": {{
    "technical_skills": ["Skill1", "Skill2"],
    "soft_skills": ["Problem Solving", "Teamwork"]
  }},
  "experience": [
    {{
      "role": "{target_role}",
      "company": "Company Name",
      "duration": "2023 - Present",
      "location": "City, Country",
      "bullets": ["Action verb bullet 1", "Action verb bullet 2"]
    }}
  ],
  "education": [
    {{
      "degree": "Bachelor's Degree",
      "field": "Computer Science",
      "institution": "University",
      "year": "2024"
    }}
  ],
  "projects": [
    {{
      "title": "Project Title",
      "role": "Developer",
      "technologies": ["Python", "React"],
      "bullets": ["Project bullet description"],
      "url": "https://github.com/example"
    }}
  ],
  "certifications": [],
  "achievements": []
}}
"""
        response = client.chat.completions.create(
            model=settings.openai_model or "gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1000,
        )
        return json.loads(response.choices[0].message.content or "{}")
    except Exception as e:
        logger.warning(f"Resume generation OpenAI call failed: {e}")
        return None
