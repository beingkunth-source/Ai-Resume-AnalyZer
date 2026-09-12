from app.services.ats_scorer import score_resume


def test_ats_scorer_is_explainable_and_deterministic():
    text = """Jane Doe
jane@example.com | +1 555 123 4567
Professional Summary
Backend developer
Skills
Python, FastAPI, SQL, PostgreSQL, Docker
Experience
Developed APIs, improved latency 40%, and led delivery.
Education
Bachelor degree
Projects
Built an ATS tool.
"""
    result = score_resume(text)
    assert result["score"] > 60
    assert result["checks"]["email"] is True
    assert result["checks"]["projects"] is True
    assert "metrics" in result
