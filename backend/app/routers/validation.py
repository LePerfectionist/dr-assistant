from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_session
from app.models.system import System
from app.models.user import User
from app.schema import SystemResponse, SystemUpdate  # ✅ Import SystemUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/systems", tags=["Systems"])

@router.patch("/{system_id}/approve", response_model=SystemResponse)
def approve_system(
    system_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Approve a system. Any logged-in user (admin or checker) can approve.
    """
    system_to_approve = session.get(System, system_id)
    if not system_to_approve:
        raise HTTPException(status_code=404, detail="System not found.")

    system_to_approve.is_approved = True
    system_to_approve.approved_by = current_user.name
    system_to_approve.approved_at = datetime.now(timezone.utc)

    session.add(system_to_approve)
    session.commit()
    session.refresh(system_to_approve)

    return system_to_approve


# ✅ NEW: Update system data (DR data, dependencies, source_reference)
@router.patch("/{system_id}/update", response_model=SystemResponse)
def update_system(
    system_id: int,
    update: SystemUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update system data. Admin or checker can update.
    """
    system = session.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found.")

    system.dr_data = update.dr_data
    system.dependencies = update.dependencies
    system.source_reference = update.source_reference

    session.add(system)
    session.commit()
    session.refresh(system)

    return system
