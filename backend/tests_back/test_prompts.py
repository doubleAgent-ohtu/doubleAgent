import os
import pytest


@pytest.fixture
def test_db(mocker):
    """Create test database (local fixture)."""
    mocker.patch.dict(os.environ, {"DA_DB_URL": "sqlite:///:memory:"})

    from app.db.models import Base
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    return TestingSessionLocal


@pytest.fixture
def test_client(test_db, mocker):
    """Create test client with mocked dependencies (local fixture)."""
    mocker.patch.dict(
        os.environ,
        {
            "DA_OPENAI_API_KEY": "test-key-123",
            "OPENAI_API_KEY": "test-key-123",
        },
    )

    from fastapi.testclient import TestClient
    from app.main import app, get_db, get_user_id

    def override_get_db():
        db = test_db()
        try:
            yield db
        finally:
            db.close()

    def override_get_user_id():
        return "test_user_123"

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_user_id] = override_get_user_id

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()


def test_save_and_get_prompts(test_client):
    """Save a prompt and retrieve it via /get_prompts."""
    payload = {"agent_name": "agent1", "prompt": "This is a test prompt"}
    r = test_client.post("/save_prompt", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["agent_name"] == "agent1"

    get_r = test_client.get("/get_prompts")
    assert get_r.status_code == 200
    prompts = get_r.json()
    assert any(p["agent_name"] == "agent1" for p in prompts)


def test_save_duplicate_agent_name_returns_409(test_client):
    """Saving two prompts with same agent_name should return 409 on second save."""
    payload = {"agent_name": "dup", "prompt": "p"}
    r1 = test_client.post("/save_prompt", json=payload)
    assert r1.status_code == 200
    r2 = test_client.post("/save_prompt", json=payload)
    assert r2.status_code == 409


def test_update_prompt_and_conflicts(test_client):
    """Update a prompt and ensure name conflicts are handled."""
    p1 = {"agent_name": "one", "prompt": "p1"}
    p2 = {"agent_name": "two", "prompt": "p2"}
    r1 = test_client.post("/save_prompt", json=p1)
    r2 = test_client.post("/save_prompt", json=p2)
    assert r1.status_code == 200
    assert r2.status_code == 200

    id2 = r2.json()["id"]

    # Attempt to rename second prompt to the first's name -> should conflict
    conflict_payload = {"agent_name": "one", "prompt": "changed"}
    r_conflict = test_client.put(f"/update_prompt/{id2}", json=conflict_payload)
    assert r_conflict.status_code == 409

    # Update second prompt to a new unique name -> should succeed
    update_payload = {"agent_name": "two-new", "prompt": "updated"}
    r_update = test_client.put(f"/update_prompt/{id2}", json=update_payload)
    assert r_update.status_code == 200
    assert r_update.json()["agent_name"] == "two-new"


def test_delete_prompt(test_client):
    """Delete a prompt and ensure it's removed."""
    payload = {"agent_name": "delme", "prompt": "please delete"}
    r = test_client.post("/save_prompt", json=payload)
    assert r.status_code == 200
    pid = r.json()["id"]

    d = test_client.delete(f"/delete_prompt/{pid}")
    assert d.status_code == 200

    # Ensure prompt is gone
    get_r = test_client.get("/get_prompts")
    assert get_r.status_code == 200
    assert all(p["id"] != pid for p in get_r.json())
