from sqlmodel import JSON, Column, SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List

from application import Application

class System(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    dr_data: str
    dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    key_contacts: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_approved: bool = False
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    source_reference: Optional[str]

    application_id: int = Field(foreign_key="application.id")
    application: Optional[Application] = Relationship(back_populates="systems")
