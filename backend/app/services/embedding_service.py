from __future__ import annotations

import math
from openai import OpenAI

from app.core.config import get_settings


def cosine_similarity(left: list[float], right: list[float]) -> float:
    denominator = math.sqrt(sum(x * x for x in left)) * math.sqrt(sum(x * x for x in right))
    return 0.0 if not denominator else max(0.0, min(1.0, sum(a * b for a, b in zip(left, right)) / denominator))


def semantic_similarity(resume_text: str, job_text: str) -> float | None:
    """Optional score. Failure intentionally does not stop deterministic job matching."""
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    client = OpenAI(api_key=settings.openai_api_key, timeout=settings.openai_timeout_seconds)
    result = client.embeddings.create(model=settings.openai_embedding_model, input=[resume_text[:30000], job_text[:30000]])
    return cosine_similarity(result.data[0].embedding, result.data[1].embedding)
