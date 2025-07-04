from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

from application import Application


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    role: str = "admin"  # or admin/checker
    created_at: datetime = Field(default_factory=datetime.timezone.utc)

    application: Optional["Application"] = Relationship(back_populates="user")
