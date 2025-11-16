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
        "Test message",
        thread_id="test-thread",
        system_prompt="New custom prompt"
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
        AIMessage(content="Third response")
    ]
    
    chatbot_service.app.invoke.side_effect = [
        {"messages": [mock_responses[0]]},
        {"messages": [mock_responses[1]]},
        {"messages": [mock_responses[2]]}
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
            (AIMessage(content="!"), {})
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
