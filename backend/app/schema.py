
from pydantic import BaseModel, EmailStr
from sqlmodel import SQLModel
from datetime import datetime
from .models.update_requests import RequestStatus
from enum import Enum
from .models.update_requests import RequestStatus
from typing import Dict, List, Optional, Any
from datetime import datetime
from .models.system import SystemType

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
    application_id: int
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    source_reference: Optional[str] = None

    class Config:
        orm_mode = True

class SystemCreateAdmin(SystemBase):
    source_reference: Optional[str] = "Manually created by admin"

class SystemCreate(SQLModel):
    name: str
    system_type: str
    
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
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    source_reference: Optional[str] = None
    is_approved: Optional[bool] = None
    approved_at: Optional[datetime] = None
    conversation_id: str

# === UPDATE REQUEST ===

class UpdateRequestCreate(BaseModel):
    system_id: int
    reason: str
    request_type: Optional[str] = "approval"

class UpdateRequestResponse(BaseModel):
    id: int
    reason: str
    status: RequestStatus
    created_at: datetime
    resolved_at: Optional[datetime] = None
    comment: Optional[str] = None
    resolved_by: Optional[int] = None
    
    # Nest the related objects
    system: SystemResponse
    requested_by_user: UserResponse
    resolved_by_user: Optional[UserResponse] = None
    
    class Config:
        orm_mode = True


# === LEGACY DR STEPS GENERATION ===
class DRStepsRequest(BaseModel):
    session_id: str
    system_choices: Dict[str, str]

class DRStepsResponse(BaseModel):
    dr_steps: str
    session_id: str



# === CHANGE PROPOSAL SCHEMAS ===

class SystemChangeProposalCreate(BaseModel):
    """Schema for creating a system change proposal"""
    system_id: int
    reason: str
    changes: Dict[str, Any]  # Dictionary of field_name -> new_value
    
    class Config:
        schema_extra = {
            "example": {
                "system_id": 1,
                "reason": "Need to update DR procedures",
                "changes": {
                    "name": "Updated System Name",
                    "dr_data": "New DR procedures...",
                    "upstream_dependencies": ["Service A", "Service B"],
                    "key_contacts": ["user@example.com"]
                }
            }
        }

class SystemChangeComparison(BaseModel):
    """Shows original vs proposed values for a field"""
    field_name: str
    original_value: Any
    proposed_value: Any
    has_changed: bool

class SystemChangeProposalResponse(BaseModel):
    """Response schema for change proposals"""
    id: int
    update_request_id: int
    system_id: int
    status: str
    created_at: datetime
    changed_fields: List[str]
    
    # The actual changes
    changes: Dict[str, Any]
    
    # System info
    system_name: str
    
    # Request info  
    requested_by: str
    reason: str
    
    class Config:
        orm_mode = True

class SystemChangeProposalReview(BaseModel):
    """Detailed view for checker review"""
    id: int
    update_request_id: int
    system_id: int
    system_name: str
    status: str
    created_at: datetime
    
    # Who requested
    requested_by_name: str
    reason: str
    
    # Comparison data
    comparisons: List[SystemChangeComparison]
    
    class Config:
        orm_mode = True

class ChangeProposalDecision(BaseModel):
    """Schema for checker's decision on change proposal"""
    action: str  # "approve" or "reject"
    comment: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "action": "approve",
                "comment": "Changes look good, approved."
            }
        }

# Update the existing UpdateRequestResponse to include change proposal info
class EnhancedUpdateRequestResponse(BaseModel):
    id: int
    reason: str
    status: str
    request_type: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    comment: Optional[str] = None
    resolved_by: Optional[int] = None
    
    # Convert these to use proper response models
    system: Optional[SystemResponse] = None
    requested_by_user: Optional[UserResponse] = None
    resolved_by_user: Optional[UserResponse] = None
    
    # Include change proposal if it exists
    change_proposal: Optional[SystemChangeProposalResponse] = None
    
    class Config:
        orm_mode = True