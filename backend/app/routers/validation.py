
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone
from typing import List

from app.database import get_session
from app.models.system import System
from app.models.user import User
from app.models.application import Application
from app.schema import SystemResponse, SystemUpdate, ApplicationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/validation", tags=["Validation"])


@router.get("/applications", response_model=List[ApplicationResponse])
def list_user_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    return db.exec(select(Application).where(Application.user_id == current_user.id)).all()


@router.get("/applications/{app_id}/systems", response_model=List[SystemResponse])
def list_systems_for_app(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    return db.exec(select(System).where(System.application_id == app_id)).all()


@router.patch("/systems/{system_id}/update", response_model=SystemResponse)
def update_system(
    system_id: int,
    update: SystemUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    system = db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found.")

    system.dr_data = update.dr_data
    system.dependencies = update.dependencies
    system.source_reference = update.source_reference

    db.add(system)
    db.commit()
    db.refresh(system)

    return system


@router.patch("/systems/{system_id}/approve", response_model=SystemResponse)
def approve_system(
    system_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    system = db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found.")

    # Allow re-approval
    system.is_approved = True
    system.approved_by = current_user.name
    system.approved_at = datetime.now(timezone.utc)

    db.add(system)
    db.commit()
    db.refresh(system)

    return system
