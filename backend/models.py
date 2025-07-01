from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from fastapi import File, UploadFile


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