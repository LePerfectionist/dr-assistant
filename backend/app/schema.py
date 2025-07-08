
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


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


class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    source_reference: Optional[str] = None
    is_approved: Optional[bool] = None
    approved_at: Optional[datetime] = None