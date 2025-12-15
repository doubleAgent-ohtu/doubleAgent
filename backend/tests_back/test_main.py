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


def test_chat_endpoint_with_a_and_b(test_client, monkeypatch):
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
    r = test_client.post("/chat", json=payload_a)
    assert r.status_code == 200
    j = r.json()
    assert j["user_message"] == "ping"
    assert j["ai_response"] == "AI-A: pong"

    payload_b = {"message": "ping", "thread_id": "t1", "chatbot": "b"}
    r = test_client.post("/chat", json=payload_b)
    assert r.status_code == 200
    j = r.json()
    assert j["ai_response"] == "AI-B: pong"


def test_download_chat(test_client, monkeypatch):
    """GET /download-chat returns a text attachment with conversation history."""
    # Mock conversation history
    monkeypatch.setattr(
        main.chatbot_a, "get_conversation_history", lambda thread_id: "Bot A:\nHello\n"
    )

    r = test_client.get("/download-chat/t123")
    assert r.status_code == 200
    assert (
        r.headers.get("content-disposition")
        == "attachment; filename=conversation_t123.txt"
    )
    assert "Hello" in r.text


def _make_async_stream(tokens):
    async def _stream(message, thread_id, model=None):
        for t in tokens:
            await asyncio.sleep(0)
            yield t

    return _stream


def test_conversation_streaming(test_client, monkeypatch):
    """POST /conversation streams SSE token events from both chatbots."""
    # Provide simple token streams for both chatbots
    monkeypatch.setattr(main.chatbot_a, "stream_chat", _make_async_stream(["A1", "A2"]))
    monkeypatch.setattr(main.chatbot_b, "stream_chat", _make_async_stream(["B1", "B2"]))

    payload = {"initial_message": "start", "turns": 2, "thread_id": "stream-1"}

    resp = test_client.post("/conversation", json=payload)
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
