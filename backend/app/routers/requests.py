# app/routers/requests.py - Updated version to handle change proposals

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import joinedload

from app.database import get_session
from app.models import UpdateRequest, System, User
from app.models.system_change_proposal import SystemChangeProposal
from app.schema import (
    SystemSource, SystemType, SystemResponse, 
    UpdateRequestCreate, EnhancedUpdateRequestResponse,
    SystemChangeProposalResponse
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/requests", tags=["Approval Requests"])

@router.post("/", response_model=EnhancedUpdateRequestResponse)
def create_approval_request(
    request_data: UpdateRequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a simple approval request (legacy functionality)"""
    if current_user.role != "viewer":
        raise HTTPException(status_code=403, detail="Only viewers can create approval requests")

    system = session.get(System, request_data.system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    existing_request = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.system_id == system.id)
        .where(UpdateRequest.requested_by == current_user.id)
        .where(UpdateRequest.status == "pending")
    ).first()

    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request for this system")

    new_request = UpdateRequest(
        system_id=system.id,
        requested_by=current_user.id,
        status="pending",
        reason=request_data.reason,
        request_type=request_data.request_type or "approval"
    )
    
    session.add(new_request)
    session.commit()
    session.refresh(new_request)
    
    # Load the request with relationships for response
    request_with_relations = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.id == new_request.id)
        .options(
            joinedload(UpdateRequest.system),
            joinedload(UpdateRequest.requested_by_user)
        )
    ).first()
    
    return request_with_relations

@router.get("/pending", response_model=List[EnhancedUpdateRequestResponse])
def get_pending_requests(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all pending requests including change proposals"""
    if current_user.role not in ["checker", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    requests = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.status == "pending")
        .options(
            joinedload(UpdateRequest.system),
            joinedload(UpdateRequest.requested_by_user),
            joinedload(UpdateRequest.resolved_by_user),
            joinedload(UpdateRequest.change_proposal)
        )
    ).all()
    
    # Convert to enhanced response format
    enhanced_requests = []
    for request in requests:
        # Convert system to response model
        system_response = SystemResponse.from_orm(request.system) if request.system else None
        
        # Convert user to response model
        requested_by_response = UserResponse.from_orm(request.requested_by_user) if request.requested_by_user else None
        resolved_by_response = UserResponse.from_orm(request.resolved_by_user) if request.resolved_by_user else None
        
        change_proposal_response = None
        if request.change_proposal:
            changes = request.change_proposal.get_changes_summary()
            change_proposal_response = SystemChangeProposalResponse(
                id=request.change_proposal.id,
                update_request_id=request.id,
                system_id=request.system_id,
                status=request.change_proposal.status,
                created_at=request.change_proposal.created_at,
                changed_fields=request.change_proposal.changed_fields,
                changes=changes,
                system_name=request.system.name if request.system else "Unknown System",
                requested_by=request.requested_by_user.name if request.requested_by_user else "Unknown User",
                reason=request.reason
            )
        
        enhanced_requests.append(EnhancedUpdateRequestResponse(
            id=request.id,
            reason=request.reason,
            status=request.status,
            request_type=request.request_type,
            created_at=request.created_at,
            resolved_at=request.resolved_at,
            comment=request.comment,
            resolved_by=request.resolved_by,
            system=system_response,
            requested_by_user=requested_by_response,
            resolved_by_user=resolved_by_response,
            change_proposal=change_proposal_response
        ))
    
    return enhanced_requests

@router.patch("/{request_id}/{action}", response_model=EnhancedUpdateRequestResponse)
def process_request(
    request_id: int,
    action: str,
    comment: Optional[str] = Body(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Process approval requests (legacy functionality - for simple approval requests)"""
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    if current_user.role not in ["checker", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    request = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.id == request_id)
        .options(
            joinedload(UpdateRequest.system),
            joinedload(UpdateRequest.requested_by_user),
            joinedload(UpdateRequest.change_proposal)
        )
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    # If this request has a change proposal, redirect to change proposal endpoint
    if request.change_proposal:
        raise HTTPException(
            status_code=400, 
            detail="This request contains system changes. Use /change-proposals/{proposal_id}/decision endpoint instead."
        )

    request.status = "approved" if action == "approve" else "rejected"
    request.resolved_at = datetime.utcnow()
    request.resolved_by = current_user.id
    request.comment = comment

    if action == "approve":
        system = session.get(System, request.system_id)
        system.is_approved = True
        system.approved_by = current_user.name
        system.approved_at = datetime.utcnow()
        session.add(system)
    
    session.add(request)
    session.commit()
    session.refresh(request)
    
    return request

@router.get("/viewer/systems", response_model=List[SystemResponse])
def get_viewer_systems(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get systems for viewer dashboard (unchanged)"""
    try:
        # Special case for demo user
        if current_user.name.lower() == "demo":
            demo_systems = [
                SystemResponse(
                    id=999,
                    application_id=999,
                    name="Demo Core Service",
                    system_type=SystemType.INTERNAL,
                    source=SystemSource.AUTO_EXTRACTED,
                    dr_data="Core DR info",
                    upstream_dependencies=["Upstream Service 1", "Upstream Service 2"],
                    downstream_dependencies=["Downstream Service 1"],
                    key_contacts=["core_contact@example.com"],
                    is_approved=True,
                    approved_by="System Admin",
                    approved_at=datetime.now(),
                    source_reference="POC"
                ),
                SystemResponse(
                    id=1000,
                    application_id=1000,
                    name="Demo Backup System",
                    system_type=SystemType.INTERNAL,
                    source=SystemSource.AUTO_EXTRACTED,
                    dr_data="Backup DR info",
                    upstream_dependencies=[],
                    downstream_dependencies=[],
                    key_contacts=["backup_contact@example.com"],
                    is_approved=True,
                    approved_by="System Admin",
                    approved_at=datetime.now(),
                    source_reference="POC"
                ),
                SystemResponse(
                    id=1001,
                    application_id=1001,
                    name="Demo Analytics Module",
                    system_type=SystemType.INTERNAL,
                    source=SystemSource.AUTO_EXTRACTED,
                    dr_data="Analytics DR info",
                    upstream_dependencies=["Core Service"],
                    downstream_dependencies=["Reporting Engine"],
                    key_contacts=["analytics_contact@example.com"],
                    is_approved=True,
                    approved_by="System Admin",
                    approved_at=datetime.now(),
                    source_reference="POC"
                ),
            ]
            return demo_systems
        stmt = select(System)
        systems = session.exec(stmt).all()
        return systems
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))