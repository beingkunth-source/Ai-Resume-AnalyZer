from tests.conftest import auth_header


def test_registration_and_me(client):
    headers = auth_header(client)
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "jane@example.com"
    assert "password_hash" not in response.text


def test_login_and_invalid_login(client):
    auth_header(client)
    logged_in = client.post("/api/auth/login", json={"email": "jane@example.com", "password": "secure-password-123"})
    assert logged_in.status_code == 200
    rejected = client.post("/api/auth/login", json={"email": "jane@example.com", "password": "incorrect"})
    assert rejected.status_code == 401
    assert rejected.json()["success"] is False


def test_unauthorized_request(client):
    assert client.get("/api/resume").status_code == 401


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
