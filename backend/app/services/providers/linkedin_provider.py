from __future__ import annotations

import logging
import os
import urllib.parse
from typing import Any
from app.services.providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

CURATED_LINKEDIN_JOBS = [
    {
        "id": "li-201",
        "external_id": "linkedin-atlassian-201",
        "source": "LinkedIn Jobs",
        "title": "Frontend Engineer (React, TypeScript & Next.js)",
        "company": "Atlassian",
        "location": "Bengaluru / Hybrid",
        "employment_type": "Full-time",
        "experience_required": "1-3 Years",
        "salary": "₹18L - ₹28L p.a.",
        "description": "Atlassian is seeking a Frontend Engineer skilled in React, TypeScript, and design systems to deliver world-class collaborative developer tools.",
        "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "Jest"],
        "url": "https://www.linkedin.com/jobs/view/frontend-developer-atlassian",
        "posted_at": "Active Today",
        "source_logo": "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzvxho"
    },
    {
        "id": "li-202",
        "external_id": "linkedin-microsoft-202",
        "source": "LinkedIn Jobs",
        "title": "AI & Generative AI Software Engineer",
        "company": "Microsoft",
        "location": "Hyderabad / Remote",
        "employment_type": "Full-time",
        "experience_required": "2-5 Years",
        "salary": "₹30L - ₹50L p.a.",
        "description": "Engineer generative AI applications, structured LLM pipelines, prompt engineering systems, and retrieval-augmented search (RAG) integrations.",
        "skills": ["Python", "TensorFlow", "PyTorch", "OpenAI", "SQL", "Pandas", "FastAPI"],
        "url": "https://www.linkedin.com/jobs/view/ai-engineer-microsoft",
        "posted_at": "Posted 2 days ago",
        "source_logo": "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzvxho"
    },
    {
        "id": "li-203",
        "external_id": "linkedin-cred-203",
        "source": "LinkedIn Jobs",
        "title": "DevOps & Cloud Infrastructure Engineer",
        "company": "CRED",
        "location": "Bengaluru / Remote",
        "employment_type": "Full-time",
        "experience_required": "2-4 Years",
        "salary": "₹20L - ₹36L p.a.",
        "description": "Manage Kubernetes clusters, Terraform infrastructure-as-code, automated CI/CD pipelines, and cloud monitoring across high-security AWS environments.",
        "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Python"],
        "url": "https://www.linkedin.com/jobs/view/devops-engineer-cred",
        "posted_at": "Posted 3 days ago",
        "source_logo": "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzvxho"
    }
]


class LinkedInProvider(BaseJobProvider):
    @property
    def name(self) -> str:
        return "LinkedIn Jobs"

    @property
    def source_key(self) -> str:
        return "linkedin"

    def is_available(self) -> str:
        api_key = os.getenv("LINKEDIN_API_KEY")
        return "available" if api_key else "fallback"

    def search_jobs(
        self,
        query: str = "",
        location: str = "",
        experience: str = "",
        remote: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        q_norm = query.lower().strip()
        loc_norm = location.lower().strip()

        matched = []
        for j in CURATED_LINKEDIN_JOBS:
            title_match = not q_norm or q_norm in j["title"].lower() or q_norm in j["company"].lower() or any(q_norm in s.lower() for s in j["skills"])
            loc_match = not loc_norm or loc_norm in j["location"].lower()
            if title_match and loc_match:
                matched.append(self.normalize_job(j))

        # Always append fallback direct LinkedIn search URL item
        search_term = query or "Software Engineer"
        loc_term = location or "India"
        linkedin_url = f"https://www.linkedin.com/jobs/search/?keywords={urllib.parse.quote(search_term)}&location={urllib.parse.quote(loc_term)}"
        fallback_item = {
            "id": f"li-fallback-{hash(query + location) % 10000}",
            "external_id": f"linkedin-search-{urllib.parse.quote(search_term)}",
            "source": "LinkedIn Jobs",
            "title": f"Explore Live '{search_term}' Vacancies on LinkedIn Jobs",
            "company": "LinkedIn Network",
            "location": loc_term,
            "employment_type": "Full-time / Remote",
            "experience_required": experience or "0-5 Years",
            "salary": "Competitive Market Salary",
            "description": f"Direct link to search '{search_term}' in {loc_term} on LinkedIn Jobs. Click View Job to see live company openings on LinkedIn.",
            "skills": [s.capitalize() for s in search_term.split()[:4]],
            "url": linkedin_url,
            "posted_at": "Live Verification Feed",
            "source_logo": "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzvxho"
        }
        matched.append(self.normalize_job(fallback_item))

        return matched[:limit]

    def normalize_job(self, raw_job: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(raw_job.get("id") or raw_job.get("external_id")),
            "external_id": str(raw_job.get("external_id") or raw_job.get("id")),
            "source": "LinkedIn Jobs",
            "title": raw_job.get("title", "Software Engineer"),
            "company": raw_job.get("company", "Tech Enterprise"),
            "location": raw_job.get("location", "India"),
            "employment_type": raw_job.get("employment_type", "Full-time"),
            "experience_required": raw_job.get("experience_required"),
            "salary": raw_job.get("salary"),
            "description": raw_job.get("description", ""),
            "skills": raw_job.get("skills", []),
            "url": raw_job.get("url", "https://www.linkedin.com/jobs"),
            "posted_at": raw_job.get("posted_at", "Recently"),
            "source_logo": raw_job.get("source_logo", "https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzvxho")
        }
