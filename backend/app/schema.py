from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from fastapi import File, UploadFile

class SystemBase(BaseModel):
    name: str
    dr_data: str
    dependencies: List[str]
    key_contacts: List[str]





class DRSystem(BaseModel):
    system_name: str
    dr_data: str
    dependencies: List[str]
    key_contact: str
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    source_reference: Optional[str]

class DRStepsRequest(BaseModel):
    session_id: str
    system_choices: Dict[str, str]

class DRStepsResponse(BaseModel):
    dr_steps: str
    session_id: str

class ChatRequest(BaseModel):
    session_id: str
    question: str
    include_dr_context: bool

class ChatResponse(BaseModel):
    answer: str

class ExtractDRSystemsRequest(BaseModel):
    files: List[UploadFile] = File(...)


class ExtractDRSystemsResponse(BaseModel):
    session_id: str
    systems_data: Dict


from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- System Schemas ---
# This is what we expect to get back from the LLM and what we'll return from the API.
class SystemBase(BaseModel):
    name: str
    dr_data: str
    dependencies: List[str]
    key_contacts: List[str]

class SystemResponse(SystemBase):
    id: int
    is_approved: bool
    source_reference: Optional[str]

    class Config:
        orm_mode = True # Helps Pydantic read data from ORM objects

# --- Runbook Schemas ---
class RunbookResponse(BaseModel):
    id: int
    filename: str
    
    class Config:
        orm_mode = True

# --- Application Schemas ---
class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    started_at: datetime
    runbooks: List[RunbookResponse] = []
    
    class Config:
        orm_mode = True

# --- User Schemas ---
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