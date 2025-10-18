from pydantic import BaseModel
from datetime import datetime


class Promt(BaseModel):
    id: int
    agent_name: str
    promt: str
    created_at: datetime


class PromtCreate(BaseModel):
    agent_name: str | None
    promt: str
