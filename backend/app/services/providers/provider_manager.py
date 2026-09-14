from __future__ import annotations

import logging
from typing import Any
from app.services.providers.base_provider import BaseJobProvider
from app.services.providers.naukri_provider import NaukriProvider
from app.services.providers.linkedin_provider import LinkedInProvider
from app.services.providers.indeed_provider import IndeedProvider
from app.services.providers.remotive_provider import RemotiveProvider

logger = logging.getLogger(__name__)


class JobProviderManager:
    """Centralized manager orchestrating multi-source job discovery."""

    def __init__(self) -> None:
        self.providers: list[BaseJobProvider] = [
            NaukriProvider(),
            LinkedInProvider(),
            IndeedProvider(),
            RemotiveProvider(),
        ]

    def get_providers_status(self) -> dict[str, str]:
        """Return operational availability status of each registered provider."""
        status_dict = {}
        for p in self.providers:
            try:
                status_dict[p.source_key] = p.is_available()
            except Exception as e:
                logger.error(f"Error checking status for provider {p.name}: {e}")
                status_dict[p.source_key] = "unavailable"
        return status_dict

    def search_all_providers(
        self,
        query: str = "",
        location: str = "",
        experience: str = "",
        remote: bool = False,
        source_filter: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], dict[str, str]]:
        """
        Query providers in parallel/sequence, normalize results, deduplicate, and apply pagination.
        """
        all_jobs: list[dict[str, Any]] = []
        statuses: dict[str, str] = {}

        target_providers = self.providers
        if source_filter and source_filter.lower() != "all":
            sf_clean = source_filter.lower()
            target_providers = [p for p in self.providers if p.source_key == sf_clean or sf_clean in p.name.lower()]

        for provider in target_providers:
            try:
                statuses[provider.source_key] = provider.is_available()
                provider_jobs = provider.search_jobs(
                    query=query,
                    location=location,
                    experience=experience,
                    remote=remote,
                    page=page,
                    limit=limit,
                )
                all_jobs.extend(provider_jobs)
            except Exception as e:
                logger.error(f"Provider {provider.name} failed during search: {e}")
                statuses[provider.source_key] = "unavailable"

        # Deduplicate jobs by unique fingerprint (source + external_id or title+company+location)
        deduped = []
        seen_keys = set()
        for job in all_jobs:
            ext_id = job.get("external_id") or job.get("id")
            source = job.get("source", "")
            title = job.get("title", "").strip().lower()
            company = job.get("company", "").strip().lower()
            loc = job.get("location", "").strip().lower()

            dedup_key = f"{source}::{ext_id}" if ext_id else f"{source}::{title}::{company}::{loc}"
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                deduped.append(job)

        return deduped, statuses


# Global singleton instance
job_provider_manager = JobProviderManager()
