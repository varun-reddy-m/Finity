from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    name: str
    type: str = Field(default="general")  # Add a default value for the type field
    created_at: datetime = Field(default_factory=datetime.utcnow)
