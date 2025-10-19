from pydantic import BaseModel
from datetime import datetime


class Prompt(BaseModel):
    id: int
    agent_name: str
    promt: str
    created_at: datetime


class PromptCreate(BaseModel):
    agent_name: str | None
    promt: str
