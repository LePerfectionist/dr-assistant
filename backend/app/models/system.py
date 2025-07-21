# from sqlmodel import JSON, Column, SQLModel, Field, Relationship
# from datetime import datetime
# from typing import Optional, List

# from .application import Application

# class System(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     name: str
#     dr_data: str
#     dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
#     key_contacts: List[str] = Field(default_factory=list, sa_column=Column(JSON))
#     is_approved: bool = False
#     approved_by: Optional[str]
#     approved_at: Optional[datetime]
#     source_reference: Optional[str]

#     application_id: str = Field(foreign_key="application.id")
#     application: Optional[Application] = Relationship(back_populates="systems")
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime
from typing import Optional, List
from enum import Enum

from .application import Application

class SystemType(str, Enum):
    INTERNAL = "internal"    # A fully extracted system with DR data
    EXTERNAL = "external"    # A known external dependency (e.g., Firewall, DNS)
    UNCLASSIFIED = "unclassified" # A newly discovered dependency needing review

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
    source_reference: Optional[str] = None

    application_id: str = Field(foreign_key="application.id")
    application: Optional[Application] = Relationship(back_populates="systems")
