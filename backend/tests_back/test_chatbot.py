import os
import sys

from app.chatbot import ChatbotService
from langchain_core.messages import AIMessage

import pytest
import pytest_asyncio
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_env(mocker):
    """Env mocking"""
    mocker.patch.dict(os.environ, {"DA_OPENAI_API_KEY": "capybara02"})


@pytest.fixture
def mock_chat_model(mocker):
    """Mocking ChatOpenAI-class"""

    mock_response = AIMessage(content="Im not AI")

    mock_model_instance = MagicMock()
    mock_model_instance.invoke.return_value = mock_response

    with patch(
        "app.chatbot.ChatOpenAI", return_value=mock_model_instance
    ) as mock_class:
        yield mock_model_instance


@pytest.fixture
def chatbot_service(mock_env, mock_chat_model):
    """Create ChatbotService-instance for tests"""

    service = ChatbotService(system_prompt="Fake prompt.")

    service.app = MagicMock()
    return service


# ---Tests---


def test_chatbot_initialization(chatbot_service):
    """Test service creating"""
    assert chatbot_service is not None
    assert chatbot_service.current_system_prompt == "Fake prompt."
    assert chatbot_service.model is not None


def test_set_system_prompt(chatbot_service):
    """Test promp creating"""
    chatbot_service.set_system_prompt("Fake prompt.")
    assert chatbot_service.current_system_prompt == "Fake prompt."


def test_chat_method(chatbot_service, mock_chat_model):
    """Test chatting"""
    mock_ai_message = AIMessage(content="Fake response")
    chatbot_service.app.invoke.return_value = {"messages": [mock_ai_message]}

    response = chatbot_service.chat("Hello, who you are?", thread_id="test-thread-1")

    assert response == "Fake response"

    chatbot_service.app.invoke.assert_called_once()


def test_chat_with_different_thread_ids(chatbot_service):
    """Test that different thread_ids work correctly"""
    mock_ai_message = AIMessage(content="Thread response")
    chatbot_service.app.invoke.return_value = {"messages": [mock_ai_message]}

    response1 = chatbot_service.chat("Message 1", thread_id="thread-1")
    response2 = chatbot_service.chat("Message 2", thread_id="thread-2")

    assert response1 == "Thread response"
    assert response2 == "Thread response"
    assert chatbot_service.app.invoke.call_count == 2


def test_chat_with_empty_message(chatbot_service):
    """Test with empty message"""
    mock_ai_message = AIMessage(content="Response to empty")
    chatbot_service.app.invoke.return_value = {"messages": [mock_ai_message]}

    response = chatbot_service.chat("", thread_id="test-thread")

    assert response == "Response to empty"


def test_chat_with_custom_system_prompt(chatbot_service):
    """Test with custom system prompt"""
    mock_ai_message = AIMessage(content="Custom prompt response")
    chatbot_service.app.invoke.return_value = {"messages": [mock_ai_message]}

    response = chatbot_service.chat(
        "Test message", thread_id="test-thread", system_prompt="New custom prompt"
    )

    assert response == "Custom prompt response"
    assert chatbot_service.current_system_prompt == "New custom prompt"


def test_chat_error_handling(chatbot_service):
    """Test error handling"""
    chatbot_service.app.invoke.side_effect = Exception("API error")

    response = chatbot_service.chat("Test message", thread_id="test-thread")

    assert "Error:" in response
    assert "API error" in response


def test_default_thread_id(chatbot_service):
    """Test default thread_id value"""
    mock_ai_message = AIMessage(content="Default thread")
    chatbot_service.app.invoke.return_value = {"messages": [mock_ai_message]}

    response = chatbot_service.chat("Test without thread_id")

    chatbot_service.app.invoke.assert_called_once()
    call_args = chatbot_service.app.invoke.call_args
    assert call_args[0][1]["configurable"]["thread_id"] == "default"


def test_system_prompt_updates(chatbot_service):
    """Test that system prompt updates correctly"""
    assert chatbot_service.current_system_prompt == "Fake prompt."

    chatbot_service.set_system_prompt("Updated prompt")
    assert chatbot_service.current_system_prompt == "Updated prompt"

    chatbot_service.set_system_prompt("Another prompt")
    assert chatbot_service.current_system_prompt == "Another prompt"


def test_chat_ignores_empty_system_prompt(chatbot_service):
    """Test that empty system prompt doesn't update"""
    original_prompt = chatbot_service.current_system_prompt
    mock_ai_message = AIMessage(content="Response")
    chatbot_service.app.invoke.return_value = {"messages": [mock_ai_message]}

    chatbot_service.chat("Test", system_prompt="   ")

    assert chatbot_service.current_system_prompt == original_prompt


def test_multiple_messages_in_conversation(chatbot_service):
    """Test multiple messages in same thread"""
    mock_responses = [
        AIMessage(content="First response"),
        AIMessage(content="Second response"),
        AIMessage(content="Third response"),
    ]

    chatbot_service.app.invoke.side_effect = [
        {"messages": [mock_responses[0]]},
        {"messages": [mock_responses[1]]},
        {"messages": [mock_responses[2]]},
    ]

    response1 = chatbot_service.chat("Message 1", thread_id="conversation-1")
    response2 = chatbot_service.chat("Message 2", thread_id="conversation-1")
    response3 = chatbot_service.chat("Message 3", thread_id="conversation-1")

    assert response1 == "First response"
    assert response2 == "Second response"
    assert response3 == "Third response"
    assert chatbot_service.app.invoke.call_count == 3


@pytest.mark.asyncio
async def test_stream_chat_basic(chatbot_service):
    """Test basic stream_chat functionality"""

    async def mock_astream(*args, **kwargs):
        messages = [
            (AIMessage(content="Hello "), {}),
            (AIMessage(content="world"), {}),
            (AIMessage(content="!"), {}),
        ]
        for msg, meta in messages:
            yield msg, meta

    chatbot_service.app.astream = mock_astream

    chunks = []
    async for chunk in chatbot_service.stream_chat("Test", thread_id="stream-test"):
        chunks.append(chunk)

    assert len(chunks) == 3
    assert chunks == ["Hello ", "world", "!"]


@pytest.mark.asyncio
async def test_stream_chat_error_handling(chatbot_service):
    """Test stream_chat error handling"""

    async def mock_astream_error(*args, **kwargs):
        raise Exception("Stream error")
        yield

    chatbot_service.app.astream = mock_astream_error

    chunks = []
    async for chunk in chatbot_service.stream_chat("Test"):
        chunks.append(chunk)

    assert len(chunks) == 1
    assert "Error:" in chunks[0]
    assert "Stream error" in chunks[0]


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
