from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class receipt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    filename: str
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    ocr_text: Optional[str] = None
