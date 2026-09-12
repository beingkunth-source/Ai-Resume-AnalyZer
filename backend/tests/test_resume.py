from tests.conftest import auth_header, upload_resume


def test_upload_list_and_ownership(client):
    owner = auth_header(client)
    uploaded = upload_resume(client, owner)
    assert uploaded.status_code == 201, uploaded.text
    resume_id = uploaded.json()["data"]["id"]
    assert uploaded.json()["data"]["text_length"] > 100
    other = auth_header(client, "other@example.com")
    assert client.get(f"/api/resume/{resume_id}", headers=other).status_code == 404
    assert len(client.get("/api/resume", headers=owner).json()["data"]) == 1


def test_rejects_invalid_file(client):
    headers = auth_header(client)
    response = client.post("/api/resume/upload", headers=headers, files={"file": ("malware.exe", b"MZ", "application/octet-stream")})
    assert response.status_code == 400
