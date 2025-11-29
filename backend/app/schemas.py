from pydantic import BaseModel, Field
from datetime import datetime


class Prompt(BaseModel):
    id: int
    user: str
    agent_name: str
    prompt: str
    created_at: datetime


class SavePrompt(BaseModel):
    agent_name: str | None = Field(max_length=50)
    prompt: str = Field(max_length=15000, min_length=1)


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
    title: str
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
    title: str = Field(max_length=255, min_length=1)
    thread_id: str = Field(max_length=100)
    model: str | None = Field(max_length=50, default=None)
    system_prompt_a: str | None = None
    system_prompt_b: str | None = None
    turns: int = Field(ge=1, le=10, default=3)
    messages: list[dict] = Field(min_length=1)
