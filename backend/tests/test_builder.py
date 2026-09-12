import pytest
from app.services.github_service import parse_github_url, generate_github_project_summary
from app.services.linkedin_service import parse_linkedin_text, enhance_bullet_point
from tests.conftest import auth_header


def test_parse_github_url():
    owner, repo = parse_github_url("https://github.com/facebook/react")
    assert owner == "facebook"
    assert repo == "react"

    owner2, repo2 = parse_github_url("github.com/torvalds/linux.git")
    assert owner2 == "torvalds"
    assert repo2 == "linux"


def test_generate_github_project_summary():
    summary = generate_github_project_summary("https://github.com/facebook/react")
    assert "title" in summary
    assert "tech_stack" in summary
    assert "key_points" in summary
    assert len(summary["key_points"]) > 0


def test_parse_linkedin_text():
    sample_text = """
    Jane Doe
    Senior AI Engineer at Tech Corp
    jane.doe@example.com
    +1 555 123 4567
    San Francisco, CA
    Experience with Python, PyTorch, React, and PostgreSQL.
    """
    parsed = parse_linkedin_text(sample_text)
    assert parsed["name"] == "Jane Doe"
    assert "headline" in parsed
    assert "skills" in parsed
    assert parsed.get("email") == "jane.doe@example.com"


def test_parse_linkedin_file():
    from app.services.linkedin_service import parse_linkedin_file
    dummy_text = "John Smith\nLead Architect\njohn@example.com\nPython, Docker, Kubernetes"
    parsed = parse_linkedin_file(dummy_text.encode("utf-8"), "profile_export.txt")
    assert parsed["name"] == "John Smith"
    assert "Python" in parsed["skills"]


def test_enhance_bullet_point():
    enhanced = enhance_bullet_point("built a web application in React")
    assert isinstance(enhanced, str)
    assert len(enhanced) > 10


def test_builder_endpoints(client):
    headers = auth_header(client)

    # Test github summarize API
    res = client.post("/api/builder/github-summarize", json={"url": "https://github.com/facebook/react"})
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "title" in res.json()["data"]

    # Test linkedin import API
    res_li = client.post("/api/builder/linkedin-import", json={"text": "John Smith\nFull Stack Developer"})
    assert res_li.status_code == 200
    assert res_li.json()["success"] is True

    # Test save built resume API
    payload = {
        "filename": "Test_Built_Resume.txt",
        "personal_info": {"name": "Test User", "email": "test@example.com"},
        "summary": "Full stack engineer",
        "experience": [{"title": "Dev", "company": "Co", "dates": "2022", "description": "Built features"}],
        "education": [],
        "projects": [],
        "skills": ["Python", "React"],
    }
    res_save = client.post("/api/builder/save-resume", json=payload, headers=headers)
    assert res_save.status_code == 201
    assert res_save.json()["success"] is True
    assert res_save.json()["data"]["id"] is not None
