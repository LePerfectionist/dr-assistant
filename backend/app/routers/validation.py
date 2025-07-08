from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import Session
from datetime import datetime, timezone

from app.database import get_session
from app.models.system import System
from app.models.user import User
from app.schema import SystemResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/systems", tags=["Systems"])

@router.patch("/{system_id}/approve", response_model=SystemResponse)
def approve_system(
    system_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) 
):
    system_to_approve = session.get(System, system_id)
    if not system_to_approve:
        raise HTTPException(status_code=404, detail="System not found.")

    # Optional: Check if the user has the 'checker' or 'admin' role
    # if current_user.role not in ["checker", "admin"]:
    #     raise HTTPException(status_code=403, detail="User does not have permission to approve.")
    
    # Update the system's attributes using the authenticated user
    system_to_approve.is_approved = True
    system_to_approve.approved_by = current_user.name
    system_to_approve.approved_at = datetime.now(timezone.utc)

    session.add(system_to_approve)
    session.commit()
    session.refresh(system_to_approve)
    
    return system_to_approve