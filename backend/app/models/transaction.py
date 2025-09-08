from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    category_id: Optional[int] = Field(nullable=False,default=None, foreign_key="category.id")
    receipt_id: Optional[int] = Field(default=None, foreign_key="receipt.id")
    type: str  
    amount: float
    currency: str = "INR"
    date: datetime
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    merchant: str = Field(nullable=False)
