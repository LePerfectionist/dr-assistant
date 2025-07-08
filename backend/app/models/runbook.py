from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

from .application import Application

class RunbookDocument(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    storage_path: str

    application_id: int = Field(foreign_key="application.id")
    application: Optional[Application] = Relationship(back_populates="runbooks")
