from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum

class RequestStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"

class UpdateRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    reason: str = Field(description="The reason the user is requesting an update.")
    status: RequestStatus = Field(default=RequestStatus.OPEN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Link to the system that needs updating
    system_id: int = Field(foreign_key="system.id")
    system: "System" = Relationship()

    # Link to the user who made the request
    requested_by_user_id: int = Field(foreign_key="user.id")
    requested_by_user: "User" = Relationship(back_populates="update_requests")