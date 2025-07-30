# from sqlmodel import SQLModel, Field, Relationship, Column, JSON
# from datetime import datetime, timedelta
# from typing import Optional, List
# from enum import Enum

# # Import Application from the correct module (uncomment this line)
# from .application import Application

# class SystemType(str, Enum):
#     INTERNAL = "internal"
#     EXTERNAL = "external"
#     UNCLASSIFIED = "unclassified"

# class System(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     name: str
#     system_type: SystemType = Field(default=SystemType.INTERNAL)
#     dr_data: Optional[str] = Field(default=None)
    
#     upstream_dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
#     downstream_dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
#     key_contacts: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
#     is_approved: bool = False
#     approved_by: Optional[str] = None
#     approved_at: Optional[datetime] = None
#     reapproval_due_at: Optional[datetime] = None  # NEW FIELD
#     source_reference: Optional[str] = None
    
#     application_id: str = Field(foreign_key="application.id")
#     application: Optional[Application] = Relationship(back_populates="systems")

from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

# Import Application from the correct module
from .application import Application

class SystemType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    UNCLASSIFIED = "unclassified"

class SystemSource(str, Enum):
    AUTO_EXTRACTED = "auto_extracted"
    MANUALLY_CREATED = "manually_created"

class System(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    system_type: SystemType = Field(default=SystemType.INTERNAL)
    source: SystemSource = Field(default=SystemSource.AUTO_EXTRACTED)
    dr_data: Optional[str] = Field(default=None)
    
    upstream_dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    downstream_dependencies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    key_contacts: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    reapproval_due_at: Optional[datetime] = None
    source_reference: Optional[str] = None
    
    application_id: str = Field(foreign_key="application.id")
    application: Optional[Application] = Relationship(back_populates="systems")

    @classmethod
    def create_external(
        cls,
        name: str,
        application_id: str,
        system_type: SystemType = SystemType.EXTERNAL,
        dr_data: Optional[str] = None,
        upstream_dependencies: Optional[List[str]] = None,
        downstream_dependencies: Optional[List[str]] = None,
        key_contacts: Optional[List[str]] = None,
        auto_created: bool = True  # Add this parameter
    ):
        return cls(
            name=name,
            system_type=system_type,
            source=SystemSource.AUTO_EXTRACTED if auto_created else SystemSource.MANUALLY_CREATED,
            dr_data=dr_data or f"{'Auto-created' if auto_created else 'Manually created'} external system: {name}",
            upstream_dependencies=upstream_dependencies or [],
            downstream_dependencies=downstream_dependencies or [],
            key_contacts=key_contacts or [],
            application_id=application_id,
            source_reference="Auto-created from dependency" if auto_created else "Manually created",
        )