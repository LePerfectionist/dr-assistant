# from sqlmodel import SQLModel, Field, Relationship
# from datetime import datetime
# from typing import Optional, TYPE_CHECKING
# from enum import Enum

# if TYPE_CHECKING:
#     from .user import User
#     from .system import System

# class RequestStatus(str, Enum):
#     PENDING = "pending"
#     APPROVED = "approved"
#     REJECTED = "rejected"

# # UpdateRequest model
# class UpdateRequest(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     system_id: int = Field(foreign_key="system.id")
#     requested_by: int = Field(foreign_key="user.id")
#     status: RequestStatus = Field(default=RequestStatus.PENDING)
#     reason: str  # Make sure this is required
#     request_type: str = Field(default="approval")  # Can be "approval" or "change"
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     resolved_at: Optional[datetime] = None
#     resolved_by: Optional[int] = Field(foreign_key="user.id", default=None)
#     comment: Optional[str] = None
    
#     # Relationships
#     system: "System" = Relationship(back_populates="update_requests")
#     requested_by_user: "User" = Relationship(back_populates="requests_made")
#     resolved_by_user: Optional["User"] = Relationship()

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from .user import User
    from .system import System

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class UpdateRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    system_id: int = Field(foreign_key="system.id")
    requested_by: int = Field(foreign_key="user.id")
    status: RequestStatus = Field(default=RequestStatus.PENDING)
    reason: str = Field(nullable=False)  # Make sure this is required and not nullable
    request_type: str = Field(default="approval")
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