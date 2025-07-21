
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
    system_update_data: SystemUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    system = db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found.")
    
    # Validation to check if dependencies are in list of allowed systems
    parent_application = system.application
    all_system_names_in_app = {s.name for s in parent_application.systems}

    if system_update_data.upstream_dependencies is not None:
        for dep_name in system_update_data.upstream_dependencies:
            if dep_name not in all_system_names_in_app:
                raise HTTPException(
                    status_code=400, # Bad Request
                    detail=f"Validation Error: Upstream dependency '{dep_name}' does not exist as a system in this application. Please create it first or correct the name."
                )
    if system_update_data.downstream_dependencies is not None:
        for dep_name in system_update_data.downstream_dependencies:
            if dep_name not in all_system_names_in_app:
                raise HTTPException(
                    status_code=400,
                    detail=f"Validation Error: Downstream dependency '{dep_name}' does not exist as a system in this application. Please create it first or correct the name."
                )
    
    


    system.dr_data = system_update_data.dr_data
    system.upstream_dependencies = system_update_data.upstream_dependencies
    system.downstream_dependencies = system_update_data.downstream_dependencies
    system.source_reference = system_update_data.source_reference

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
