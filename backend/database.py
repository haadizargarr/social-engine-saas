import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load the keys out of our secret .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the core engine
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Create a SessionLocal class. Each instance of this will be a unique database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the base class that our database tables will inherit from later
Base = declarative_base()

# Helper function to get a database session and close it automatically when done
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()