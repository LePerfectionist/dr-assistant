from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

# Import Application from the correct module (uncomment this line)
from .application import Application

class SystemType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    UNCLASSIFIED = "unclassified"

class System(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    system_type: SystemType = Field(default=SystemType.INTERNAL)
    dr_data: Optional[str] = Field(default=None)
    
    upstream_dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    downstream_dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    key_contacts: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    reapproval_due_at: Optional[datetime] = None  # NEW FIELD
    source_reference: Optional[str] = None
    
    application_id: str = Field(foreign_key="application.id")
    application: Optional[Application] = Relationship(back_populates="systems")