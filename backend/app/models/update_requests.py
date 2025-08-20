# app/models/update_requests.py - Updated version
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from .user import User
    from .system import System
    from .system_change_proposal import SystemChangeProposal

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class RequestType(str, Enum):
    APPROVAL = "approval"
    CHANGE = "change"  # New type for change proposals

class UpdateRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    system_id: int = Field(foreign_key="system.id")
    requested_by: int = Field(foreign_key="user.id")
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    reason: str = Field(nullable=False)  
    request_type: RequestType = Field(default=RequestType.APPROVAL)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = Field(foreign_key="user.id", default=None)
    comment: Optional[str] = None
    
    # Relationships with explicit foreign keys
    system: "System" = Relationship(back_populates="update_requests")
    requested_by_user: "User" = Relationship(
        back_populates="update_requests",
        sa_relationship_kwargs={"foreign_keys": "[UpdateRequest.requested_by]"}
    )
    resolved_by_user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UpdateRequest.resolved_by]"}
    )
    
    # New relationship for change proposals
    change_proposal: Optional["SystemChangeProposal"] = Relationship(
        back_populates="update_request",
        sa_relationship_kwargs={"uselist": False}
    )