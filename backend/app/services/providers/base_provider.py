from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseJobProvider(ABC):
    """Abstract base class for all job providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the job provider (e.g. 'Naukri.com', 'LinkedIn Jobs', 'Indeed', 'Remotive')."""
        pass

    @property
    @abstractmethod
    def source_key(self) -> str:
        """Provider identifier key (e.g. 'naukri', 'linkedin', 'indeed', 'remotive')."""
        pass

    @abstractmethod
    def is_available(self) -> str:
        """
        Check provider availability state.
        Returns:
        - "available": Direct API / live feed is active and operational.
        - "fallback": API key missing or external site restricted; returns safe external search URLs.
        - "unavailable": Provider encountered a network failure.
        """
        pass

    @abstractmethod
    def search_jobs(
        self,
        query: str = "",
        location: str = "",
        experience: str = "",
        remote: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search for jobs matching query and filters, returning raw or normalized dictionaries."""
        pass

    @abstractmethod
    def normalize_job(self, raw_job: dict[str, Any]) -> dict[str, Any]:
        """
        Normalize a raw job entry into the standard HireLens job dictionary format:
        {
            "id": str,
            "source": str,
            "title": str,
            "company": str,
            "location": str,
            "employment_type": str,
            "experience_required": str | None,
            "salary": str | None,
            "description": str,
            "skills": list[str],
            "url": str,
            "posted_at": str | None,
            "source_logo": str | None
        }
        """
        pass
