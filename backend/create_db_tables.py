import os
import sys
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, create_engine
from dotenv import load_dotenv

load_dotenv()


class LangChainHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    response: str
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))


class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    agent_name: str
    prompt: str
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))


# Database
DATABASE_URL = os.getenv("DA_DB_URL", None)

if not DATABASE_URL:
    print("Error DA_DB_URL not set.")
    sys.exit(1)
    
engine = create_engine(DATABASE_URL, echo=True)

def drop_and_create_tables():
    # Drop all tables
    SQLModel.metadata.drop_all(engine)
    print("All tables dropped.")

    # Create tables
    print("Creating LangChainHistory table...")
    LangChainHistory.__table__.create(engine, checkfirst=True)
    print("LangChainHistory table created.")

    print("Creating Prompt table...")
    Prompt.__table__.create(engine, checkfirst=True)
    print("Prompt table created.")

    print("Database tables recreated successfully!")

if __name__ == "__main__":
    drop_and_create_tables()
