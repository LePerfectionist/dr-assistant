# from fastapi import APIRouter, Depends, HTTPException
# from sqlmodel import Session, select
# from typing import List
# from app.schema import UpdateRequestCreate
# from typing import List, Optional
# from app.database import get_session
# from app.models import UpdateRequest, System, User
# from app.schema import UpdateRequestResponse
# from app.routers.auth import get_current_user
# from app.schema import SystemResponse  # Import the response model

# from fastapi import Body  
# router = APIRouter(prefix="/requests", tags=["Approval Requests"])

# @router.post("/", response_model=UpdateRequestResponse)
# def create_approval_request(
#     request_data: UpdateRequestCreate,
#     session: Session = Depends(get_session),
#     current_user: User = Depends(get_current_user)
# ):
#     # Only viewers can create requests
#     if current_user.role != "viewer":
#         raise HTTPException(
#             status_code=403, 
#             detail="Only viewers can create approval requests"
#         )

#     system = session.get(System, request_data.system_id)
#     if not system:
#         raise HTTPException(status_code=404, detail="System not found")

#     # Check for existing pending request
#     existing_request = session.exec(
#         select(UpdateRequest)
#         .where(UpdateRequest.system_id == system.id)
#         .where(UpdateRequest.requested_by == current_user.id)
#         .where(UpdateRequest.status == "pending")
#     ).first()

#     if existing_request:
#         raise HTTPException(
#             status_code=400,
#             detail="You already have a pending request for this system"
#         )

#     new_request = UpdateRequest(
#         system_id=system.id,
#         requested_by=current_user.id,
#         status="pending",
#         reason=request_data.reason,
#         request_type=request_data.request_type or "approval"  # Default to approval
#     )
    
#     session.add(new_request)
#     session.commit()
#     session.refresh(new_request)
    
#     return new_request

# @router.get("/pending", response_model=List[UpdateRequestResponse])
# def get_pending_requests(
#     session: Session = Depends(get_session),
#     current_user: User = Depends(get_current_user)
# ):
#     # Only checkers/admins can see pending requests
#     if current_user.role not in ["checker", "admin"]:
#         raise HTTPException(status_code=403, detail="Not authorized")

#     requests = session.exec(
#         select(UpdateRequest)
#         .where(UpdateRequest.status == "pending")
#         .options(joinedload(UpdateRequest.system), 
#                joinedload(UpdateRequest.requested_by_user))
#     ).all()
    
#     return requests

# @router.patch("/{request_id}/{action}", response_model=UpdateRequestResponse)
# def process_request(
#     request_id: int,
#     action: str,
#     comment: Optional[str] = Body(None),
#     session: Session = Depends(get_session),
#     current_user: User = Depends(get_current_user)
# ):
#     # Validate action
#     if action not in ["approve", "reject"]:
#         raise HTTPException(status_code=400, detail="Invalid action")

#     # Only checkers/admins can process requests
#     if current_user.role not in ["checker", "admin"]:
#         raise HTTPException(status_code=403, detail="Not authorized")

#     request = session.get(UpdateRequest, request_id)
#     if not request:
#         raise HTTPException(status_code=404, detail="Request not found")

#     if request.status != "pending":
#         raise HTTPException(status_code=400, detail="Request already processed")

#     # Update request
#     request.status = "approved" if action == "approve" else "rejected"
#     request.resolved_at = datetime.utcnow()
#     request.resolved_by = current_user.id
#     request.comment = comment

#     # If approved, update the system
#     if action == "approve":
#         system = session.get(System, request.system_id)
#         system.is_approved = True
#         system.approved_by = current_user.name
#         system.approved_at = datetime.utcnow()
#         session.add(system)
    
#     session.add(request)
#     session.commit()
#     session.refresh(request)
    
#     return request

# @router.patch("/{request_id}/approve", response_model=UpdateRequestResponse)
# def approve_request(
#     request_id: int,
#     session: Session = Depends(get_session),
#     current_user: User = Depends(get_current_user)
# ):
#     # Only checkers/admins can approve
#     if current_user.role not in ["checker", "admin"]:
#         raise HTTPException(status_code=403, detail="Not authorized")

#     request = session.get(UpdateRequest, request_id)
#     if not request:
#         raise HTTPException(status_code=404, detail="Request not found")

#     request.status = "approved"
#     request.resolved_at = datetime.utcnow()
#     request.resolved_by = current_user.id
    
#     # Also approve the system
#     system = session.get(System, request.system_id)
#     system.is_approved = True
#     system.approved_by = current_user.name
#     system.approved_at = datetime.utcnow()
    
#     session.add_all([request, system])
#     session.commit()
#     session.refresh(request)
    
#     return request

# @router.get("/viewer/systems", response_model=List[SystemResponse])
# def get_viewer_systems(
#     session: Session = Depends(get_session),
#     current_user: User = Depends(get_current_user)
# ):
#     try:
#         # Get ALL systems regardless of approval status
#         stmt = select(System)
#         systems = session.exec(stmt).all()
#         return systems
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import joinedload

from app.database import get_session
from app.models import UpdateRequest, System, User
from app.schema import UpdateRequestResponse, SystemResponse
from app.routers.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.schema import UpdateRequestCreate
from typing import List, Optional
from app.database import get_session
from app.models import UpdateRequest, System, User
from app.schema import UpdateRequestResponse
from app.routers.auth import get_current_user
from app.schema import SystemResponse  # Import the response model

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
        stmt = select(System)
        systems = session.exec(stmt).all()
        return systems
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))