from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from .update_requests import UpdateRequest
    from .application import Application

class UserRole(str, Enum):
    ADMIN = "admin"
    CHECKER = "checker"
    VIEWER = "viewer"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    password: str
    role: UserRole = Field(default=UserRole.VIEWER)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships with explicit foreign keys
    update_requests: List["UpdateRequest"] = Relationship(
        back_populates="requested_by_user",
        sa_relationship_kwargs={"foreign_keys": "[UpdateRequest.requested_by]"}
    )
    applications: List["Application"] = Relationship(back_populates="user")