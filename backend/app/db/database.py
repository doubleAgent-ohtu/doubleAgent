import os
from dotenv import load_dotenv

from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DA_DB_URL", None)
if DATABASE_URL is None:
    raise ValueError("DA_DB_URL environment variable is not set")

app_env = os.getenv("DA_ENVIRONMENT", "production").lower()

engine_args = {"echo": True}

if app_env == "development":
    print("INFO: Running in 'development' mode, using NullPool (for supabase reasons).")
    engine_args["poolclass"] = pool.NullPool
else:
    print(f"INFO: Running in '{app_env}' mode, using default QueuePool.")

engine = create_engine(DATABASE_URL, **engine_args)
Session = sessionmaker(bind=engine)
