from pydantic import BaseModel
from datetime import datetime


class Prompt(BaseModel):
    id: int
    agent_name: str
    prompt: str
    created_at: datetime


class PromptCreate(BaseModel):
    agent_name: str | None
    prompt: str
