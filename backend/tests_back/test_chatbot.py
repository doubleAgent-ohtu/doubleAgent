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
