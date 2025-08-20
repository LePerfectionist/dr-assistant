# app/models/system_change_proposal.py
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from .update_requests import UpdateRequest
    from .system import System
    from .user import User

class ChangeProposalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved" 
    REJECTED = "rejected"

class SystemChangeProposal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Link to the update request
    update_request_id: int = Field(foreign_key="updaterequest.id")
    
    # Link to original system
    system_id: int = Field(foreign_key="system.id")
    
    # Proposed changes (JSON fields to store the new values)
    proposed_name: Optional[str] = None
    proposed_dr_data: Optional[str] = None
    proposed_upstream_dependencies: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    proposed_downstream_dependencies: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    proposed_key_contacts: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    proposed_system_type: Optional[str] = None
    proposed_source_reference: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: ChangeProposalStatus = Field(default=ChangeProposalStatus.PENDING)
    
    # What fields were actually changed (for easy filtering)
    changed_fields: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # Relationships
    update_request: "UpdateRequest" = Relationship(back_populates="change_proposal")
    system: "System" = Relationship()
    
    def get_changes_summary(self) -> dict:
        """Returns a dictionary of only the fields that have proposed changes"""
        changes = {}
        
        if self.proposed_name is not None:
            changes['name'] = self.proposed_name
        if self.proposed_dr_data is not None:
            changes['dr_data'] = self.proposed_dr_data
        if self.proposed_upstream_dependencies is not None:
            changes['upstream_dependencies'] = self.proposed_upstream_dependencies
        if self.proposed_downstream_dependencies is not None:
            changes['downstream_dependencies'] = self.proposed_downstream_dependencies
        if self.proposed_key_contacts is not None:
            changes['key_contacts'] = self.proposed_key_contacts
        if self.proposed_system_type is not None:
            changes['system_type'] = self.proposed_system_type
        if self.proposed_source_reference is not None:
            changes['source_reference'] = self.proposed_source_reference
            
        return changes