from pydantic import BaseModel, Field
from datetime import datetime


class Prompt(BaseModel):
    id: int
    user: str
    agent_name: str
    prompt: str
    created_at: datetime


class SavePrompt(BaseModel):
    user: str
    agent_name: str | None = Field(max_length=50)
    prompt: str = Field(max_length=4000, min_length=1)
