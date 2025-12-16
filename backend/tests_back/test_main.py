import os
import asyncio
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DA_DB_URL", "sqlite:///:memory:")
os.environ.setdefault("DA_ENVIRONMENT", "testing")
os.environ.setdefault("OPENAI_API_KEY", "test-key-123")
os.environ.setdefault("DA_OPENAI_API_KEY", "test-key-123")

from app import main


@pytest.fixture
def test_client():
    """Test client with mocked authentication dependency."""
    # Override auth dependency to simulate a logged-in user
    main.app.dependency_overrides[main.get_current_user] = lambda: {
        "sub": "test-user",
        "username": "tester",
    }
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def test_health(test_client):
    """Health endpoint returns healthy status."""
    r = test_client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "healthy"}


def test_me(test_client):
    """Authenticated `/me` returns user info from session override."""
    r = test_client.get("/me")
    assert r.status_code == 200
    body = r.json()
    assert body["sub"] == "test-user"

