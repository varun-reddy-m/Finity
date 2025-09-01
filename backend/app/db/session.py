from sqlmodel import SQLModel, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import URL
import os

from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.receipt import Receipt

# Update DATABASE_URL to use Supabase connection string
DATABASE_URL = os.getenv("DATABASE_URL", URL.create(
    drivername="postgresql",
    username=os.getenv("SUPABASE_DB_USER"),
    password=os.getenv("SUPABASE_DB_PASSWORD"),
    host=os.getenv("SUPABASE_DB_HOST"),
    port=os.getenv("SUPABASE_DB_PORT"),
    database=os.getenv("SUPABASE_DB_NAME")
))

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    SQLModel.metadata.create_all(bind=engine)

