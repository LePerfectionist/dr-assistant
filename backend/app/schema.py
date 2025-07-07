from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from fastapi import File, UploadFile


class ExtractedSystem(BaseModel):
    """A data schema for a single DR system extracted from a document."""
    name: str = Field(description="The name of the application or system. e.g., 'Oracle Finance DB', 'Main Web App Cluster'.")
    dr_data: str = Field(description="A summary of the key disaster recovery procedures or information for this system.")
    dependencies: Optional[List[str]] = Field(description="A list of other systems or services this system depends on for recovery.")
    key_contacts: Optional[List[str]] = Field(description="A list of key contacts or teams responsible for this system's recovery (names or email addresses).")


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