from tests.conftest import auth_header, upload_resume


def test_job_description_crud(client):
    headers = auth_header(client)
    payload = {"title": "Backend Developer", "company": "Acme Corp", "description": "We are looking for a Python developer with FastAPI and PostgreSQL experience."}
    created = client.post("/api/jobs", headers=headers, json=payload)
    assert created.status_code == 201, created.text
    job_id = created.json()["data"]["id"]

    listed = client.get("/api/jobs", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()["data"]) == 1

    detail = client.get(f"/api/jobs/{job_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["data"]["title"] == "Backend Developer"

    deleted = client.delete(f"/api/jobs/{job_id}", headers=headers)
    assert deleted.status_code == 200
    assert client.get("/api/jobs", headers=headers).json()["data"] == []


def test_job_ownership_enforced(client):
    owner = auth_header(client)
    other = auth_header(client, "other@example.com")
    created = client.post("/api/jobs", headers=owner, json={"title": "Dev", "description": "A job description that is long enough to pass validation requirements."})
    job_id = created.json()["data"]["id"]
    assert client.get(f"/api/jobs/{job_id}", headers=other).status_code == 404
    assert client.delete(f"/api/jobs/{job_id}", headers=other).status_code == 404


def test_job_match_flow(client):
    headers = auth_header(client)
    resume_id = upload_resume(client, headers).json()["data"]["id"]
    job_created = client.post("/api/jobs", headers=headers, json={"title": "Backend Developer", "company": "Acme", "description": "Python FastAPI PostgreSQL Docker REST API AWS 3 years experience building backend services."})
    job_id = job_created.json()["data"]["id"]
    match_response = client.post("/api/jobs/match", headers=headers, json={"resume_id": resume_id, "job_id": job_id})
    assert match_response.status_code == 200, match_response.text
    data = match_response.json()["data"]
    assert "job_match_score" in data
    assert "matched_skills" in data
    assert "missing_skills" in data
    assert isinstance(data["matched_skills"], list)


def test_job_match_rejects_other_user_resume(client):
    owner = auth_header(client)
    other = auth_header(client, "other@example.com")
    job = client.post("/api/jobs", headers=owner, json={"title": "Dev", "description": "A job description with sufficient length to pass validation."})
    job_id = job.json()["data"]["id"]
    resume = upload_resume(client, other)
    resume_id = resume.json()["data"]["id"]
    match_response = client.post("/api/jobs/match", headers=owner, json={"resume_id": resume_id, "job_id": job_id})
    assert match_response.status_code == 404


def test_delete_job_cascades(client):
    headers = auth_header(client)
    resume_id = upload_resume(client, headers).json()["data"]["id"]
    job = client.post("/api/jobs", headers=headers, json={"title": "Dev", "description": "A job description that is long enough to pass validation requirements."})
    job_id = job.json()["data"]["id"]
    client.post("/api/jobs/match", headers=headers, json={"resume_id": resume_id, "job_id": job_id})
    deleted = client.delete(f"/api/jobs/{job_id}", headers=headers)
    assert deleted.status_code == 200
    assert client.get("/api/jobs", headers=headers).json()["data"] == []
