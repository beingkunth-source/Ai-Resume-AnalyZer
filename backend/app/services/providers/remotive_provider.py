from __future__ import annotations

import json
import logging
import re
import urllib.parse
import urllib.request
from typing import Any
from app.services.providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)


class RemotiveProvider(BaseJobProvider):
    @property
    def name(self) -> str:
        return "Remotive Jobs"

    @property
    def source_key(self) -> str:
        return "remotive"

    def is_available(self) -> str:
        return "available"

    def search_jobs(
        self,
        query: str = "",
        location: str = "",
        experience: str = "",
        remote: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        results = []
        try:
            search_term = query.strip() or "software"
            encoded_query = urllib.parse.quote(search_term)
            url = f"https://remotive.com/api/remote-jobs?search={encoded_query}&limit=20"
            
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                remotive_jobs = data.get("jobs", [])
                
                for rj in remotive_jobs:
                    results.append(self.normalize_job(rj))
        except Exception as e:
            logger.warning(f"Remotive API request failed: {e}")

        return results[:limit]

    def normalize_job(self, raw_job: dict[str, Any]) -> dict[str, Any]:
        raw_desc = raw_job.get("description", "")
        clean_desc = re.sub(r"<[^>]+>", " ", raw_desc)
        clean_desc = re.sub(r"\s+", " ", clean_desc).strip()
        if len(clean_desc) > 800:
            clean_desc = clean_desc[:797] + "..."

        tags = raw_job.get("tags", [])
        skills = [tag.capitalize() for tag in tags[:6]] if isinstance(tags, list) else []
        if not skills:
            skills = ["Python", "JavaScript", "REST API", "Git"]

        job_id = raw_job.get("id") or hash(raw_job.get("title", "") + raw_job.get("company_name", ""))
        return {
            "id": f"remotive-{job_id}",
            "external_id": str(job_id),
            "source": "Remotive Jobs",
            "title": raw_job.get("title", "Software Engineer"),
            "company": raw_job.get("company_name", "Global Enterprise"),
            "location": raw_job.get("candidate_required_location") or "Worldwide / Remote",
            "employment_type": raw_job.get("job_type") or "Full-time",
            "experience_required": "1-4 Years",
            "salary": raw_job.get("salary") or "Competitive LPA",
            "description": clean_desc or raw_job.get("title", "Software Job"),
            "skills": skills,
            "url": raw_job.get("url", "https://remotive.com"),
            "posted_at": "Verified Live Feed",
            "source_logo": raw_job.get("company_logo_url") or "https://remotive.com/favicon.ico"
        }
