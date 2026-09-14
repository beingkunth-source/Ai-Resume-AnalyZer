from __future__ import annotations

import logging
import os
import urllib.parse
from typing import Any
from app.services.providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

CURATED_INDEED_JOBS = [
    {
        "id": "ind-301",
        "external_id": "indeed-zoho-301",
        "source": "Indeed",
        "title": "Full Stack Developer (Python & React)",
        "company": "Zoho Corporation",
        "location": "Chennai / Remote",
        "employment_type": "Full-time",
        "experience_required": "0-2 Years",
        "salary": "₹8L - ₹15L p.a.",
        "description": "Zoho is hiring Full Stack Developers to design web applications using Python, JavaScript, React, PostgreSQL, and REST APIs.",
        "skills": ["Python", "React", "JavaScript", "PostgreSQL", "HTML", "CSS"],
        "url": "https://www.indeed.com/jobs?q=full+stack+developer+zoho",
        "posted_at": "Posted 1 day ago",
        "source_logo": "https://d2q79iu7y74834.cloudfront.net/images/indeed-logo.png"
    },
    {
        "id": "ind-302",
        "external_id": "indeed-freshworks-302",
        "source": "Indeed",
        "title": "Backend Software Development Engineer",
        "company": "Freshworks",
        "location": "Chennai / Bengaluru",
        "employment_type": "Full-time",
        "experience_required": "1-3 Years",
        "salary": "₹16L - ₹26L p.a.",
        "description": "Build high-speed SaaS API services, database query optimizations, background workers, and distributed microservices.",
        "skills": ["Python", "Java", "SQL", "Redis", "AWS", "Docker"],
        "url": "https://www.indeed.com/jobs?q=backend+engineer+freshworks",
        "posted_at": "Posted 2 days ago",
        "source_logo": "https://d2q79iu7y74834.cloudfront.net/images/indeed-logo.png"
    }
]


class IndeedProvider(BaseJobProvider):
    @property
    def name(self) -> str:
        return "Indeed"

    @property
    def source_key(self) -> str:
        return "indeed"

    def is_available(self) -> str:
        api_key = os.getenv("INDEED_API_KEY")
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
        for j in CURATED_INDEED_JOBS:
            title_match = not q_norm or q_norm in j["title"].lower() or q_norm in j["company"].lower() or any(q_norm in s.lower() for s in j["skills"])
            loc_match = not loc_norm or loc_norm in j["location"].lower()
            if title_match and loc_match:
                matched.append(self.normalize_job(j))

        # Always append fallback direct Indeed search URL item
        search_term = query or "Software Engineer"
        loc_term = location or "India"
        indeed_url = f"https://www.indeed.com/jobs?q={urllib.parse.quote(search_term)}&l={urllib.parse.quote(loc_term)}"
        fallback_item = {
            "id": f"ind-fallback-{hash(query + location) % 10000}",
            "external_id": f"indeed-search-{urllib.parse.quote(search_term)}",
            "source": "Indeed",
            "title": f"Explore Live '{search_term}' Listings on Indeed",
            "company": "Indeed Job Search",
            "location": loc_term,
            "employment_type": "Full-time",
            "experience_required": experience or "0-4 Years",
            "salary": "Market Standard Salary",
            "description": f"Direct link to search '{search_term}' in {loc_term} on Indeed. Click View Job to see real-time listings on Indeed.",
            "skills": [s.capitalize() for s in search_term.split()[:4]],
            "url": indeed_url,
            "posted_at": "Live Verification Feed",
            "source_logo": "https://d2q79iu7y74834.cloudfront.net/images/indeed-logo.png"
        }
        matched.append(self.normalize_job(fallback_item))

        return matched[:limit]

    def normalize_job(self, raw_job: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(raw_job.get("id") or raw_job.get("external_id")),
            "external_id": str(raw_job.get("external_id") or raw_job.get("id")),
            "source": "Indeed",
            "title": raw_job.get("title", "Software Developer"),
            "company": raw_job.get("company", "Tech Enterprise"),
            "location": raw_job.get("location", "India"),
            "employment_type": raw_job.get("employment_type", "Full-time"),
            "experience_required": raw_job.get("experience_required"),
            "salary": raw_job.get("salary"),
            "description": raw_job.get("description", ""),
            "skills": raw_job.get("skills", []),
            "url": raw_job.get("url", "https://www.indeed.com"),
            "posted_at": raw_job.get("posted_at", "Recently"),
            "source_logo": raw_job.get("source_logo", "https://d2q79iu7y74834.cloudfront.net/images/indeed-logo.png")
        }
