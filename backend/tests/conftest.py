import os
import uuid

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test-only-secret"

from app.core.config import get_settings
get_settings.cache_clear()

import fitz
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.database import Base, get_db
from app.main import app

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def auth_header(client, email="jane@example.com"):
    response = client.post("/api/auth/register", json={"name": "Jane Doe", "email": email, "password": "secure-password-123"})
    assert response.status_code == 201, response.text
    return {"Authorization": "Bearer " + response.json()["data"]["access_token"]}



def pdf_bytes(text=None):
    if text is None:
        text = (
            "Jane Doe\n"
            "jane@example.com\n"
            "+1 555 123 4567\n"
            "\n"
            "Professional Summary\n"
            "Python engineer\n"
            "\n"
            "Skills\n"
            "Python, FastAPI, SQL, PostgreSQL, Docker\n"
            "\n"
            "Experience\n"
            "Developed APIs and improved latency by 35%.\n"
            "\n"
            "Education\n"
            "Bachelor of Science\n"
            "\n"
            "Projects\n"
            "Built Resume Analyzer"
        )
    document = fitz.open()
    page = document.new_page(width=612, height=792)
    fontname = "helv"
    text_writer = fitz.TextWriter(page.rect)
    font = fitz.Font(fontname)
    text_writer.append((72, 72), text, font=font, fontsize=11)
    text_writer.write_text(page)
    data = document.tobytes()
    document.close()
    return data


def upload_resume(client, headers, text=None):
    return client.post("/api/resume/upload", headers=headers, files={"file": ("my_resume.pdf", pdf_bytes(text), "application/pdf")})

