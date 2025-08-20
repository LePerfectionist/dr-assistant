# app/routers/change_proposals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_session
from app.models import UpdateRequest, System, User
from app.models.system_change_proposal import SystemChangeProposal, ChangeProposalStatus
from app.models.update_requests import RequestType
from app.schema import (
    SystemChangeProposalCreate, 
    SystemChangeProposalResponse, 
    SystemChangeProposalReview,
    SystemChangeComparison,
    ChangeProposalDecision,
    EnhancedUpdateRequestResponse
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/change-proposals", tags=["Change Proposals"])

@router.post("/", response_model=SystemChangeProposalResponse)
def create_change_proposal(
    proposal_data: SystemChangeProposalCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Viewer creates a change proposal for a system"""
    if current_user.role != "viewer":
        raise HTTPException(status_code=403, detail="Only viewers can create change proposals")

    # Check if system exists
    system = session.get(System, proposal_data.system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    # Check for existing pending requests for this system by this user
    existing_request = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.system_id == system.id)
        .where(UpdateRequest.requested_by == current_user.id)
        .where(UpdateRequest.status == "pending")
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=400, 
            detail="You already have a pending request for this system"
        )

    # Create update request
    update_request = UpdateRequest(
        system_id=system.id,
        requested_by=current_user.id,
        status="pending",
        reason=proposal_data.reason,
        request_type=RequestType.CHANGE
    )
    
    session.add(update_request)
    session.commit()
    session.refresh(update_request)

    # Create change proposal
    change_proposal = SystemChangeProposal(
        update_request_id=update_request.id,
        system_id=system.id,
        changed_fields=list(proposal_data.changes.keys())
    )

    # Set the proposed values based on the changes
    for field_name, new_value in proposal_data.changes.items():
        if field_name == "name":
            change_proposal.proposed_name = new_value
        elif field_name == "dr_data":
            change_proposal.proposed_dr_data = new_value
        elif field_name == "upstream_dependencies":
            change_proposal.proposed_upstream_dependencies = new_value
        elif field_name == "downstream_dependencies":
            change_proposal.proposed_downstream_dependencies = new_value
        elif field_name == "key_contacts":
            change_proposal.proposed_key_contacts = new_value
        elif field_name == "system_type":
            change_proposal.proposed_system_type = new_value
        elif field_name == "source_reference":
            change_proposal.proposed_source_reference = new_value

    session.add(change_proposal)
    session.commit()
    session.refresh(change_proposal)

    # Return response
    return SystemChangeProposalResponse(
        id=change_proposal.id,
        update_request_id=update_request.id,
        system_id=system.id,
        status=change_proposal.status,
        created_at=change_proposal.created_at,
        changed_fields=change_proposal.changed_fields,
        changes=proposal_data.changes,
        system_name=system.name,
        requested_by=current_user.name,
        reason=proposal_data.reason
    )

@router.get("/pending", response_model=List[SystemChangeProposalReview])
def get_pending_change_proposals(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Checker gets all pending change proposals for review"""
    if current_user.role not in ["checker", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get all pending change proposals with relationships
    stmt = (
        select(SystemChangeProposal)
        .join(UpdateRequest)
        .where(SystemChangeProposal.status == ChangeProposalStatus.PENDING)
        .options(
            joinedload(SystemChangeProposal.update_request)
            .joinedload(UpdateRequest.requested_by_user),
            joinedload(SystemChangeProposal.system)
        )
    )
    
    proposals = session.exec(stmt).all()
    
    result = []
    for proposal in proposals:
        # Create comparison data
        comparisons = []
        system = proposal.system
        
        for field_name in proposal.changed_fields:
            original_value = None
            proposed_value = None
            
            if field_name == "name":
                original_value = system.name
                proposed_value = proposal.proposed_name
            elif field_name == "dr_data":
                original_value = system.dr_data
                proposed_value = proposal.proposed_dr_data
            elif field_name == "upstream_dependencies":
                original_value = system.upstream_dependencies
                proposed_value = proposal.proposed_upstream_dependencies
            elif field_name == "downstream_dependencies":
                original_value = system.downstream_dependencies
                proposed_value = proposal.proposed_downstream_dependencies
            elif field_name == "key_contacts":
                original_value = system.key_contacts
                proposed_value = proposal.proposed_key_contacts
            elif field_name == "system_type":
                original_value = system.system_type
                proposed_value = proposal.proposed_system_type
            elif field_name == "source_reference":
                original_value = system.source_reference
                proposed_value = proposal.proposed_source_reference
                
            comparisons.append(SystemChangeComparison(
                field_name=field_name,
                original_value=original_value,
                proposed_value=proposed_value,
                has_changed=True
            ))
        
        result.append(SystemChangeProposalReview(
            id=proposal.id,
            update_request_id=proposal.update_request_id,
            system_id=proposal.system_id,
            system_name=system.name,
            status=proposal.status,
            created_at=proposal.created_at,
            requested_by_name=proposal.update_request.requested_by_user.name,
            reason=proposal.update_request.reason,
            comparisons=comparisons
        ))
    
    return result

@router.patch("/{proposal_id}/decision", response_model=SystemChangeProposalResponse)
def process_change_proposal(
    proposal_id: int,
    decision: ChangeProposalDecision,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Checker approves or rejects a change proposal"""
    if current_user.role not in ["checker", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if decision.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    # Get the change proposal with relationships
    proposal = session.exec(
        select(SystemChangeProposal)
        .where(SystemChangeProposal.id == proposal_id)
        .options(
            joinedload(SystemChangeProposal.update_request),
            joinedload(SystemChangeProposal.system)
        )
    ).first()
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Change proposal not found")

    if proposal.status != ChangeProposalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Change proposal already processed")

    # Update the proposal status
    proposal.status = ChangeProposalStatus.APPROVED if decision.action == "approve" else ChangeProposalStatus.REJECTED

    # Update the related update request
    update_request = proposal.update_request
    update_request.status = "approved" if decision.action == "approve" else "rejected"
    update_request.resolved_at = datetime.utcnow()
    update_request.resolved_by = current_user.id
    update_request.comment = decision.comment

    # If approved, apply the changes to the actual system
    if decision.action == "approve":
        system = proposal.system
        
        if proposal.proposed_name is not None:
            system.name = proposal.proposed_name
        if proposal.proposed_dr_data is not None:
            system.dr_data = proposal.proposed_dr_data
        if proposal.proposed_upstream_dependencies is not None:
            system.upstream_dependencies = proposal.proposed_upstream_dependencies
        if proposal.proposed_downstream_dependencies is not None:
            system.downstream_dependencies = proposal.proposed_downstream_dependencies
        if proposal.proposed_key_contacts is not None:
            system.key_contacts = proposal.proposed_key_contacts
        if proposal.proposed_system_type is not None:
            system.system_type = proposal.proposed_system_type
        if proposal.proposed_source_reference is not None:
            system.source_reference = proposal.proposed_source_reference
            
        session.add(system)

    session.add(proposal)
    session.add(update_request)
    session.commit()
    session.refresh(proposal)

    # Return response
    changes = proposal.get_changes_summary()
    return SystemChangeProposalResponse(
        id=proposal.id,
        update_request_id=proposal.update_request_id,
        system_id=proposal.system_id,
        status=proposal.status,
        created_at=proposal.created_at,
        changed_fields=proposal.changed_fields,
        changes=changes,
        system_name=proposal.system.name,
        requested_by=update_request.requested_by_user.name,
        reason=update_request.reason
    )