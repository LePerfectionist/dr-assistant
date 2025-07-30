
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from .models.update_requests import RequestStatus
from enum import Enum

class SystemType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    UNCLASSIFIED = "unclassified"

class SystemSource(str, Enum):
    AUTO_EXTRACTED = "auto_extracted"
    MANUALLY_CREATED = "manually_created"

class SystemBase(BaseModel):
    name: str
    dr_data: Optional[str] = None
    system_type: SystemType = SystemType.INTERNAL
    source: SystemSource = SystemSource.AUTO_EXTRACTED  # NEW FIELD
    upstream_dependencies: List[str] = []
    downstream_dependencies: List[str] = []
    key_contacts: List[str] = []

class SystemResponse(SystemBase):
    id: int
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    source_reference: Optional[str] = None

    class Config:
        orm_mode = True

class SystemCreateAdmin(SystemBase):
    source_reference: Optional[str] = "Manually created by admin"

class SystemUpdate(BaseModel):
    name: Optional[str] = None  # Add this if you want to allow name updates
    dr_data: Optional[str] = None
    system_type: Optional[SystemType] = None
    upstream_dependencies: Optional[List[str]] = None
    downstream_dependencies: Optional[List[str]] = None
    key_contacts: Optional[List[str]] = None
    source_reference: Optional[str] = None
    force_external: Optional[bool] = False
   


# === RUNBOOK ===
class RunbookResponse(BaseModel):
    id: int
    filename: str

    class Config:
        orm_mode = True

# === APPLICATION ===
class ApplicationResponse(BaseModel):
    id: int
    name: str  # Make sure this field exists
    user_id: int
    user_name: Optional[str]=None  # Add this field to show who created it
    started_at: datetime
    last_updated: datetime
    runbooks: List[RunbookResponse]

    class Config:
        orm_mode = True

# === USER ===
class UserCreate(BaseModel):
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

# === CHAT ===
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    source_reference: Optional[str] = None
    is_approved: Optional[bool] = None
    approved_at: Optional[datetime] = None

# === UPDATE REQUEST ===
class UpdateRequestCreate(BaseModel):
    system_id: int
    reason: str

class UpdateRequestResponse(BaseModel):
    id: int
    reason: str
    status: RequestStatus
    created_at: datetime
    
    # Nest the related objects for a rich response
    system: SystemResponse
    requested_by_user: UserResponse
    
    class Config:
        orm_mode = True