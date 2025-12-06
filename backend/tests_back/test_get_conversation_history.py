import os
from unittest.mock import MagicMock, patch

from app.chatbot import ChatbotService
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


def test_get_conversation_history_includes_messages_and_skips_system():
    # Ensure env var set so ChatbotService initializes without error
    with patch.dict(os.environ, {"DA_OPENAI_API_KEY": "testkey"}):
        # Patch ChatOpenAI so no real external calls are made during init
        with patch("app.chatbot.ChatOpenAI") as MockChat:
            MockChat.return_value = MagicMock()

            service = ChatbotService(system_prompt="Test prompt")

            # Prepare a fake state returned by service.app.get_state
            messages = [
                HumanMessage(content="Hi from user"),
                AIMessage(content="Hello from AI"),
                SystemMessage(content="system info should be skipped"),
            ]

            fake_state = MagicMock()
            fake_state.values = {"messages": messages}

            service.app = MagicMock()
            service.app.get_state.return_value = fake_state

            conversation_text = service.get_conversation_history("thread-123")

            # HumanMessage should be labeled as Bot B and included
            assert "Bot B:" in conversation_text
            assert "Hi from user" in conversation_text

            # AIMessage should be labeled as Bot A and included
            assert "Bot A:" in conversation_text
            assert "Hello from AI" in conversation_text

            # SystemMessage content must be skipped
            assert "system info should be skipped" not in conversation_text


def test_get_conversation_history_empty_messages_returns_empty_string():
    with patch.dict(os.environ, {"DA_OPENAI_API_KEY": "testkey"}):
        with patch("app.chatbot.ChatOpenAI") as MockChat:
            MockChat.return_value = MagicMock()

            service = ChatbotService(system_prompt="Test prompt")

            fake_state = MagicMock()
            fake_state.values = {"messages": []}

            service.app = MagicMock()
            service.app.get_state.return_value = fake_state

            conversation_text = service.get_conversation_history("thread-empty")

            assert conversation_text == ""
