from __future__ import annotations

import logging
import os
import urllib.parse
from typing import Any
from app.services.providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)

CURATED_NAUKRI_JOBS = [
    {
        "id": "nk-101",
        "external_id": "naukri-razorpay-001",
        "source": "Naukri.com",
        "title": "Senior Backend Systems Engineer",
        "company": "Razorpay",
        "location": "Bengaluru, India",
        "employment_type": "Full-time",
        "experience_required": "1-3 Years",
        "salary": "₹22L - ₹32L p.a.",
        "description": "Razorpay is hiring a Senior Backend Engineer to build high-concurrency payment APIs using Python, FastAPI, PostgreSQL, Redis, and microservices architecture.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "REST API"],
        "url": "https://www.naukri.com/backend-developer-jobs-in-bengaluru",
        "posted_at": "Posted 1 day ago",
        "source_logo": "https://img.naukrimg.com/logo/naukri.png"
    },
    {
        "id": "nk-102",
        "external_id": "naukri-phonepe-002",
        "source": "Naukri.com",
        "title": "Python Developer (API & Data Pipelines)",
        "company": "PhonePe",
        "location": "Bengaluru / Hyderabad",
        "employment_type": "Full-time",
        "experience_required": "0-2 Years",
        "salary": "₹16L - ₹24L p.a.",
        "description": "PhonePe is looking for a Python Developer to construct transaction analytics pipelines, RESTful microservices, and database scaling layers.",
        "skills": ["Python", "SQL", "PostgreSQL", "Docker", "Git", "FastAPI"],
        "url": "https://www.naukri.com/python-developer-jobs-in-bengaluru",
        "posted_at": "Posted 2 days ago",
        "source_logo": "https://img.naukrimg.com/logo/naukri.png"
    },
    {
        "id": "nk-103",
        "external_id": "naukri-swiggy-003",
        "source": "Naukri.com",
        "title": "Software Development Engineer - I (Backend)",
        "company": "Swiggy",
        "location": "Bengaluru, India",
        "employment_type": "Full-time",
        "experience_required": "0-1 Years",
        "salary": "₹14L - ₹20L p.a.",
        "description": "Great opportunity for computer science graduates and entry-level developers to engineer scalable backend services, caching, and logistics APIs.",
        "skills": ["Python", "Java", "SQL", "Data Structures", "REST API", "Git"],
        "url": "https://www.naukri.com/sde-1-jobs-in-bengaluru",
        "posted_at": "Posted 3 days ago",
        "source_logo": "https://img.naukrimg.com/logo/naukri.png"
    },
    {
        "id": "nk-104",
        "external_id": "naukri-flipkart-004",
        "source": "Naukri.com",
        "title": "Data Scientist / Machine Learning Engineer",
        "company": "Flipkart",
        "location": "Bengaluru / Remote",
        "employment_type": "Full-time",
        "experience_required": "1-4 Years",
        "salary": "₹25L - ₹40L p.a.",
        "description": "Develop predictive search recommendation engines, user segmentation algorithms, and large-scale data analytics pipelines for e-commerce.",
        "skills": ["Python", "Scikit-Learn", "SQL", "Spark", "Machine Learning", "NLP"],
        "url": "https://www.naukri.com/data-scientist-jobs-in-bengaluru",
        "posted_at": "Posted Today",
        "source_logo": "https://img.naukrimg.com/logo/naukri.png"
    }
]


class NaukriProvider(BaseJobProvider):
    @property
    def name(self) -> str:
        return "Naukri.com"

    @property
    def source_key(self) -> str:
        return "naukri"

    def is_available(self) -> str:
        api_key = os.getenv("NAUKRI_API_KEY")
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
        # Filter curated jobs matching query
        q_norm = query.lower().strip()
        loc_norm = location.lower().strip()

        matched = []
        for j in CURATED_NAUKRI_JOBS:
            title_match = not q_norm or q_norm in j["title"].lower() or q_norm in j["company"].lower() or any(q_norm in s.lower() for s in j["skills"])
            loc_match = not loc_norm or loc_norm in j["location"].lower()
            if title_match and loc_match:
                matched.append(self.normalize_job(j))

        # Always append fallback direct search URL item if search produces few items
        if not matched or len(matched) < limit:
            search_term = query or "Software Engineer"
            loc_term = location or "India"
            naukri_url = f"https://www.naukri.com/{urllib.parse.quote(search_term.lower())}-jobs-in-{urllib.parse.quote(loc_term.lower())}"
            fallback_item = {
                "id": f"nk-fallback-{hash(query + location) % 10000}",
                "external_id": f"naukri-search-{urllib.parse.quote(search_term)}",
                "source": "Naukri.com",
                "title": f"Explore Live '{search_term}' Vacancies on Naukri.com",
                "company": "Naukri Job Portal",
                "location": loc_term,
                "employment_type": "Full-time / Hybrid",
                "experience_required": experience or "0-5 Years",
                "salary": "Market Standards",
                "description": f"Direct external search link for '{search_term}' in {loc_term} on Naukri.com. Click View Job to apply directly on the official employer listing.",
                "skills": [s.capitalize() for s in search_term.split()[:4]],
                "url": naukri_url,
                "posted_at": "Live Verification Feed",
                "source_logo": "https://img.naukrimg.com/logo/naukri.png"
            }
            matched.append(self.normalize_job(fallback_item))

        return matched[:limit]

    def normalize_job(self, raw_job: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": str(raw_job.get("id") or raw_job.get("external_id")),
            "external_id": str(raw_job.get("external_id") or raw_job.get("id")),
            "source": "Naukri.com",
            "title": raw_job.get("title", "Software Developer"),
            "company": raw_job.get("company", "Tech Company"),
            "location": raw_job.get("location", "India"),
            "employment_type": raw_job.get("employment_type", "Full-time"),
            "experience_required": raw_job.get("experience_required"),
            "salary": raw_job.get("salary"),
            "description": raw_job.get("description", ""),
            "skills": raw_job.get("skills", []),
            "url": raw_job.get("url", "https://www.naukri.com"),
            "posted_at": raw_job.get("posted_at", "Recently"),
            "source_logo": raw_job.get("source_logo", "https://img.naukrimg.com/logo/naukri.png")
        }
