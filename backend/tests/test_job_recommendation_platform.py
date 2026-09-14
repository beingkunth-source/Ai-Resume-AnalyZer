from tests.conftest import auth_header, upload_resume
from app.services.candidate_profile_service import extract_candidate_profile
from app.services.hybrid_matcher import calculate_hybrid_job_match
from app.services.providers.provider_manager import job_provider_manager


def test_candidate_profile_extractor():
    sample_text = """
    Jane Doe - Python Backend Developer
    Skills: Python, FastAPI, PostgreSQL, Docker, AWS, React, Git, Linux
    Education: B.Tech CSE in Computer Science
    Experience: 2 years building RESTful microservices.
    """
    profile = extract_candidate_profile(sample_text)
    assert "Backend Developer" in profile["target_roles"]
    assert "Python" in profile["programming_languages"]
    assert "FastAPI" in profile["frameworks"]
    assert profile["degree"] == "Bachelor's Degree"
    assert profile["years_of_experience"] == 2.0


def test_job_provider_manager_and_hybrid_matcher():
    jobs, statuses = job_provider_manager.search_all_providers(query="Python Backend Developer", limit=10)
    assert len(jobs) > 0
    assert "naukri" in statuses
    assert "linkedin" in statuses
    assert "indeed" in statuses

    sample_resume = "Experienced Python Backend Developer proficient in FastAPI, PostgreSQL, Redis, Docker, and AWS."
    match_result = calculate_hybrid_job_match(sample_resume, jobs[0])
    assert match_result["match_score"] >= 0
    assert match_result["category"] in ["BEST MATCHES", "GOOD MATCHES", "POTENTIAL MATCHES", "LOW MATCH"]


def test_job_recommendations_and_application_tracking_api(client):
    headers = auth_header(client)
    res = upload_resume(client, headers)
    resume_id = res.json()["data"]["id"]

    # 1. Recommended Jobs Endpoint
    rec_resp = client.get(f"/api/jobs/recommended/{resume_id}", headers=headers)
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()["data"]
    assert "candidate_profile" in rec_data
    assert "results" in rec_data
    assert len(rec_data["results"]) > 0

    job_db_id = rec_data["results"][0]["job_db_id"]

    # 2. Save Job Endpoint
    save_resp = client.post(f"/api/jobs/{job_db_id}/save", headers=headers)
    assert save_resp.status_code == 200
    assert save_resp.json()["data"]["saved"] is True

    get_saved = client.get("/api/jobs/saved", headers=headers)
    assert get_saved.status_code == 200
    assert len(get_saved.json()["data"]) >= 1

    # 3. Track Application Endpoint
    app_resp = client.post("/api/applications", headers=headers, json={"job_id": job_db_id, "status": "Applied", "notes": "Submitted application on employer site"})
    assert app_resp.status_code == 201
    assert app_resp.json()["data"]["status"] == "Applied"

    get_apps = client.get("/api/applications", headers=headers)
    assert get_apps.status_code == 200
    assert len(get_apps.json()["data"]) >= 1

    # Update application status
    app_id = app_resp.json()["data"]["id"]
    patch_app = client.patch(f"/api/applications/{app_id}", headers=headers, json={"status": "Interview", "notes": "Technical interview scheduled"})
    assert patch_app.status_code == 200
    assert patch_app.json()["data"]["status"] == "Interview"

    # Clean up save & application
    unsave_resp = client.delete(f"/api/jobs/{job_db_id}/save", headers=headers)
    assert unsave_resp.status_code == 200

    del_app = client.delete(f"/api/applications/{app_id}", headers=headers)
    assert del_app.status_code == 200
