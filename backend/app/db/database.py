import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DA_DB_URL", None)

engine = create_engine(DATABASE_URL, echo=True)
Session = sessionmaker(bind=engine)
