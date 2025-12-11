from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class Prompt(BaseModel):
    id: int
    agent_name: str
    prompt: str
    created_at: datetime


class SavePrompt(BaseModel):
    agent_name: str = Field(max_length=50)
    prompt: str = Field(max_length=15000)

    @field_validator("agent_name")
    @classmethod
    def check_valid_agent_name(cls, agent_name: str) -> str:
        name = agent_name.strip()
        if name == "":
            raise ValueError("Missing agent name")

        return name

    @field_validator("prompt")
    @classmethod
    def check_valid_prompt(cls, prompt: str) -> str:
        pr = prompt.strip()
        if pr == "":
            raise ValueError("Missing prompt")

        return pr


class MessageSchema(BaseModel):
    chatbot: str
    message: str
    order: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class ConversationSchema(BaseModel):
    id: int
    user: str
    conversation_starter: str
    thread_id: str
    model: str | None
    system_prompt_a: str | None
    system_prompt_b: str | None
    turns: int
    created_at: datetime
    messages: list[MessageSchema] = []

    class Config:
        from_attributes = True


class SaveConversation(BaseModel):
    conversation_starter: str = Field(max_length=15000, min_length=1)
    thread_id: str = Field(max_length=100)
    model: str | None = Field(max_length=50, default=None)
    system_prompt_a: str | None = None
    system_prompt_b: str | None = None
    turns: int = Field(ge=1, le=20, default=3)
    messages: list[dict] = Field(min_length=1)
