from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import joinedload

from app.database import get_session
from app.models import UpdateRequest, System, User
from app.schema import SystemSource, SystemType, UpdateRequestResponse, SystemResponse
from app.routers.auth import get_current_user
from app.schema import UpdateRequestCreate

from fastapi import Body  
router = APIRouter(prefix="/requests", tags=["Approval Requests"])

@router.post("/", response_model=UpdateRequestResponse)
def create_approval_request(
    request_data: UpdateRequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
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
    return new_request

@router.get("/pending", response_model=List[UpdateRequestResponse])
def get_pending_requests(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["checker", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    requests = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.status == "pending")
        .options(
            joinedload(UpdateRequest.system),
            joinedload(UpdateRequest.requested_by_user)
        )
    ).all()
    
    return requests

@router.patch("/{request_id}/{action}", response_model=UpdateRequestResponse)
def process_request(
    request_id: int,
    action: str,
    comment: Optional[str] = Body(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    if current_user.role not in ["checker", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    request = session.get(UpdateRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

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