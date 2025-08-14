from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.system import System, SystemType, SystemSource
from app.models.user import User, UserRole
from app.models.update_requests  import UpdateRequest
from app.schema import SystemResponse, UpdateRequestCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/viewer", tags=["Viewer"])


def get_current_viewer(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure the user is at least a Viewer."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Any role can view, so no specific role check is needed here
    return current_user

@router.get("/systems", response_model=List[SystemResponse])
def get_approved_systems(
    session: Session = Depends(get_session),
    viewer: User = Depends(get_current_viewer)
):
    """
    Returns a list of all systems that are currently approved.
    This is the main data endpoint for a viewer's dashboard.
    """
    print("Entering /systems endpoint")

    # Special case: hardcoded demo systems
    if viewer.name.lower() == "demo":
        print("Demo exmple systems")
        demo_systems = [
            SystemResponse(
                id=999,
                name="Demo Core Service",
                system_type=SystemType.INTERNAL,
                source=SystemSource.MANUAL,
                dr_data="Demo DR info",
                upstream_dependencies=["Demo Upstream 1", "Demo Upstream 2"],
                downstream_dependencies=["Demo Downstream 1"],
                key_contacts=["demo_contact@example.com"],
                is_approved=True,
                approved_by="System Admin",
                approved_at=datetime.now(),
                source_reference="POC"
            ),
            SystemResponse(
                id=1000,
                name="Demo Backup System",
                system_type=SystemType.EXTERNAL,
                source=SystemSource.MANUAL,
                dr_data="Backup DR info",
                upstream_dependencies=[],
                downstream_dependencies=[],
                key_contacts=["backup_contact@example.com"],
                is_approved=True,
                approved_by="System Admin",
                approved_at=datetime.now(),
                source_reference="POC"
            )
        ]
        return demo_systems

    print("Searching for approved systems")
    statement = (
        select(System)
        .where(System.is_approved == True)
        .order_by(System.name)
    )
    systems = session.exec(statement).all()
    return systems

@router.get("/systems/{system_id}", response_model=SystemResponse)
def get_single_approved_system(
    system_id: int,
    session: Session = Depends(get_session),
    viewer: User = Depends(get_current_viewer)
):
    """Returns details for a single approved system."""
    print("Entering /systems/system_id endpoint")

    system = session.get(System, system_id)
    if not system or not system.is_approved:
        raise HTTPException(status_code=404, detail="Approved system not found.")
    return system


@router.post("/update-requests", status_code=201)
def raise_update_request(
    request_data: UpdateRequestCreate,
    session: Session = Depends(get_session),
    viewer: User = Depends(get_current_viewer)
):
    """Allows a logged-in user to raise a request to update a system."""
    # Verify the system they are referencing exists and is approved
    system_to_update = session.get(System, request_data.system_id)
    if not system_to_update or not system_to_update.is_approved:
        raise HTTPException(status_code=404, detail="Cannot raise request: Approved system not found.")

    new_request = UpdateRequest(
        reason=request_data.reason,
        system_id=request_data.system_id,
        requested_by_user_id=viewer.id
    )
    
    session.add(new_request)
    session.commit()
    
    return {"message": "Update request submitted successfully."}