from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

from .application import Application

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    password: str
    role: str = "admin"  # can be "admin" or "checker"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    applications: List["Application"] = Relationship(back_populates="user")
