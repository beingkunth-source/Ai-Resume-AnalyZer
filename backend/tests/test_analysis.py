from app.schemas.analysis import AIAnalysis
from tests.conftest import auth_header, upload_resume


def fake_ai(_text):
    return AIAnalysis.model_validate({
        "candidate_information": {"name": "Jane Doe"},
        "scores": {"overall": 80, "ats": 70, "skills": 81, "experience": 82, "education": 78, "projects": 77, "formatting": 85, "keywords": 80, "impact": 79},
        "technical_skills": ["Python"], "soft_skills": [], "education": [], "experience": [], "projects": [], "certifications": [], "achievements": [], "languages": [], "links": [], "strengths": ["Clear skills"], "weaknesses": [], "missing_sections": [], "formatting_issues": [], "grammar_issues": [], "keywords": ["Python"], "recommendations": ["Keep tailoring the resume."],
    })


def test_analysis_uses_mock_and_protects_ownership(client, monkeypatch):
    monkeypatch.setattr("app.api.analysis.analyze_resume_with_ai", fake_ai)
    owner = auth_header(client)
    resume_id = upload_resume(client, owner).json()["data"]["id"]
    response = client.post(f"/api/analysis/{resume_id}", headers=owner)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["scores"]["ats"] >= 0
    other = auth_header(client, "intruder@example.com")
    assert client.get(f"/api/analysis/{data['id']}", headers=other).status_code == 404


def test_job_matching(client):
    headers = auth_header(client)
    resume_id = upload_resume(client, headers).json()["data"]["id"]
    job = client.post("/api/jobs", headers=headers, json={"title": "Backend Developer", "company": "Example", "description": "Looking for a Python FastAPI developer with PostgreSQL, Docker, REST API, AWS, and 3 years experience building backend services."})
    job_id = job.json()["data"]["id"]
    response = client.post("/api/jobs/match", headers=headers, json={"resume_id": resume_id, "job_id": job_id})
    assert response.status_code == 200, response.text
    assert "python" in response.json()["data"]["matched_skills"]


def test_dashboard_empty(client):
    headers = auth_header(client)
    response = client.get("/api/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_resumes"] == 0
    assert data["total_analyses"] == 0
    assert data["average_score"] is None


def test_dashboard_with_data(client, monkeypatch):
    monkeypatch.setattr("app.api.analysis.analyze_resume_with_ai", fake_ai)
    headers = auth_header(client)
    upload_resume(client, headers)
    resume_id = upload_resume(client, headers).json()["data"]["id"]
    client.post(f"/api/analysis/{resume_id}", headers=headers)
    response = client.get("/api/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_resumes"] == 2
    assert data["total_analyses"] == 1
    assert data["average_score"] is not None
    assert data["average_ats_score"] is not None
    assert len(data["recent_analyses"]) == 1
