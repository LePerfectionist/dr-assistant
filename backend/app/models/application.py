from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

# from models.runbook import RunbookDocument
# from models.user import User
# from models.system import System

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    user_id: int = Field(foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="application")

    runbooks: List["RunbookDocument"] = Relationship(back_populates="application")
    systems: List["System"] = Relationship(back_populates="application")
