from pydantic import BaseModel, Field
from datetime import datetime


class Prompt(BaseModel):
    id: int
    prompt: str
    agent_name: str
    created_at: datetime


class PromptSave(BaseModel):
    prompt: str = Field(max_length=4000, min_length=1)
    agent_name: str | None = Field(max_length=50)
