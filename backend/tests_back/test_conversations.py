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
def test_client_app():
    """Test client with mocked authentication dependency for app-level endpoints."""
    main.app.dependency_overrides[main.get_current_user] = lambda: {
        "sub": "test-user",
        "username": "tester",
    }
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def _make_async_stream(tokens):
    async def _stream(message, thread_id, model=None):
        for t in tokens:
            await asyncio.sleep(0)
            yield t

    return _stream


def test_chat_endpoint_with_a_and_b(test_client_app, monkeypatch):
    """POST /chat returns responses from the selected chatbot."""
    # Mock chatbot_a.chat and chatbot_b.chat
    monkeypatch.setattr(
        main.chatbot_a,
        "chat",
        lambda message, thread_id, system_prompt, model: "AI-A: pong",
    )
    monkeypatch.setattr(
        main.chatbot_b,
        "chat",
        lambda message, thread_id, system_prompt, model: "AI-B: pong",
    )

    payload_a = {"message": "ping", "thread_id": "t1", "chatbot": "a"}
    r = test_client_app.post("/chat", json=payload_a)
    assert r.status_code == 200
    j = r.json()
    assert j["user_message"] == "ping"
    assert j["ai_response"] == "AI-A: pong"

    payload_b = {"message": "ping", "thread_id": "t1", "chatbot": "b"}
    r = test_client_app.post("/chat", json=payload_b)
    assert r.status_code == 200
    j = r.json()
    assert j["ai_response"] == "AI-B: pong"


def test_download_chat(test_client_app, monkeypatch):
    """GET /download-chat returns a text attachment with conversation history."""
    # Mock conversation history
    monkeypatch.setattr(
        main.chatbot_a, "get_conversation_history", lambda thread_id: "Bot A:\nHello\n"
    )

    r = test_client_app.get("/download-chat/t123")
    assert r.status_code == 200
    assert (
        r.headers.get("content-disposition")
        == "attachment; filename=conversation_t123.txt"
    )
    assert "Hello" in r.text


def test_conversation_streaming(test_client_app, monkeypatch):
    """POST /conversation streams SSE token events from both chatbots."""
    # Provide simple token streams for both chatbots
    monkeypatch.setattr(main.chatbot_a, "stream_chat", _make_async_stream(["A1", "A2"]))
    monkeypatch.setattr(main.chatbot_b, "stream_chat", _make_async_stream(["B1", "B2"]))

    payload = {"initial_message": "start", "turns": 2, "thread_id": "stream-1"}

    resp = test_client_app.post("/conversation", json=payload)
    assert resp.status_code == 200

    # Collect lines from the event-stream and ensure token events were sent
    found_token = False
    for line in resp.iter_lines():
        if not line:
            continue
        if isinstance(line, bytes):
            line = line.decode("utf-8", errors="ignore")
        if "token" in line or '"type": "token"' in line:
            found_token = True
            break

    assert found_token, "No token events received in stream"


# -- Database-backed tests and fixtures ---------------------------------------


@pytest.fixture
def test_db(mocker):
    """Create test database"""
    # Mock the DA_DB_URL environment variable
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
    """Create test client with mocked dependencies"""
    # Mock environment variables before importing app
    mocker.patch.dict(
        os.environ,
        {
            "DA_OPENAI_API_KEY": "test-key-123",
            "OPENAI_API_KEY": "test-key-123",
        },
    )
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


def test_save_conversation(test_client):
    """Test saving a conversation with messages"""
    conversation_data = {
        "conversation_starter": "Hello, how are you?",
        "thread_id": "test-thread-001",
        "model": "gpt-4o",
        "system_prompt_a": "You are a helpful assistant.",
        "system_prompt_b": "You are a knowledgeable expert.",
        "turns": 3,
        "messages": [
            {"chatbot": "user", "message": "Hello, how are you?"},
            {"chatbot": "a", "message": "I'm doing well, thank you!"},
            {"chatbot": "b", "message": "That's great to hear!"},
        ],
    }

    response = test_client.post("/conversations", json=conversation_data)

    assert response.status_code == 200
    data = response.json()

    assert data["user"] == "test_user_123"
    assert data["conversation_starter"] == "Hello, how are you?"
    assert data["thread_id"] == "test-thread-001"
    assert data["model"] == "gpt-4o"
    assert data["system_prompt_a"] == "You are a helpful assistant."
    assert data["system_prompt_b"] == "You are a knowledgeable expert."
    assert data["turns"] == 3
    assert "id" in data
    assert "created_at" in data

    assert len(data["messages"]) == 3
    assert data["messages"][0]["chatbot"] == "user"
    assert data["messages"][0]["message"] == "Hello, how are you?"
    assert data["messages"][0]["order"] == 0
    assert data["messages"][1]["chatbot"] == "a"
    assert data["messages"][1]["order"] == 1
    assert data["messages"][2]["chatbot"] == "b"
    assert data["messages"][2]["order"] == 2


def test_retrieve_saved_conversation(test_client):
    """Test retrieving a saved conversation"""
    conversation_data = {
        "conversation_starter": "Test message",
        "thread_id": "test-thread-002",
        "turns": 2,
        "messages": [
            {"chatbot": "user", "message": "Test message"},
            {"chatbot": "a", "message": "Test response"},
        ],
    }

    post_response = test_client.post("/conversations", json=conversation_data)
    conversation_id = post_response.json()["id"]

    get_response = test_client.get(f"/conversations/{conversation_id}")

    assert get_response.status_code == 200
    data = get_response.json()
    assert data["id"] == conversation_id
    assert len(data["messages"]) == 2


def test_save_multiple_conversations(test_client):
    """Test saving multiple conversations"""
    conv1_data = {
        "conversation_starter": "First question",
        "thread_id": "thread-1",
        "model": "gpt-4o",
        "turns": 2,
        "messages": [
            {"chatbot": "user", "message": "First question"},
            {"chatbot": "a", "message": "First answer"},
        ],
    }

    conv2_data = {
        "conversation_starter": "Second question",
        "thread_id": "thread-2",
        "model": "gpt-4o-mini",
        "turns": 3,
        "messages": [
            {"chatbot": "user", "message": "Second question"},
            {"chatbot": "a", "message": "Second answer"},
            {"chatbot": "b", "message": "More details"},
        ],
    }

    response1 = test_client.post("/conversations", json=conv1_data)
    response2 = test_client.post("/conversations", json=conv2_data)

    assert response1.status_code == 200
    assert response2.status_code == 200

    list_response = test_client.get("/conversations")

    assert list_response.status_code == 200
    conversations = list_response.json()
    assert len(conversations) == 2


@pytest.mark.parametrize(
    "turns,expected_status",
    [
        (0, 422),
        (25, 422),
        (10, 200),
        (1, 200),
        (20, 200),
    ],
)
def test_conversation_validation_turns(test_client, turns, expected_status):
    """Test conversation validation with various turn values"""
    data = {
        "conversation_starter": "Test",
        "thread_id": f"thread-test-{turns}",
        "turns": turns,
        "messages": [{"chatbot": "user", "message": "Test"}],
    }

    response = test_client.post("/conversations", json=data)
    assert response.status_code == expected_status


def test_delete_conversation(test_client):
    """Test deleting a conversation"""
    conv_data = {
        "conversation_starter": "To be deleted",
        "thread_id": "thread-delete",
        "turns": 2,
        "messages": [
            {"chatbot": "user", "message": "To be deleted"},
            {"chatbot": "a", "message": "Response"},
        ],
    }

    create_response = test_client.post("/conversations", json=conv_data)
    assert create_response.status_code == 200
    conversation_id = create_response.json()["id"]

    delete_response = test_client.delete(f"/conversations/{conversation_id}")

    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Conversation deleted successfully"

    get_response = test_client.get(f"/conversations/{conversation_id}")
    assert get_response.status_code == 404


def test_delete_nonexistent_conversation(test_client):
    """Test deleting a non-existent conversation"""
    response = test_client.delete("/conversations/99999")

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
