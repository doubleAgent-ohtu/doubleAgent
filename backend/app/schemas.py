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

