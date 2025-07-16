# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlmodel import Session, select
# from typing import List

# from app.database import get_session
# from app.models.user import User
# from app.models.application import Application
# from app.models.system import System
# from app.models.runbook import RunbookDocument
# from app.schema import UserResponse, UserUpdate, SystemCreateAdmin, SystemResponse

# from app.routers.auth import get_current_user, get_password_hash

# router = APIRouter(prefix="/admin", tags=["Admin"])

# # --- Admin Auth Guard ---
# def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
#     if current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="The user does not have administrative privileges."
#         )
#     return current_user

# # === USER MANAGEMENT ===

# @router.get("/users", response_model=List[UserResponse])
# def get_all_users(
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     return session.exec(select(User)).all()

# @router.post("/users", response_model=UserResponse)
# def create_user(
#     user_data: UserUpdate,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     if not user_data.email or not user_data.password:
#         raise HTTPException(status_code=400, detail="Email and password are required")

#     new_user = User(
#         name=user_data.name or "New User",
#         email=user_data.email,
#         password=get_password_hash(user_data.password),
#         role=user_data.role or "checker"
#     )
#     session.add(new_user)
#     session.commit()
#     session.refresh(new_user)
#     return new_user

# # === APPLICATION MANAGEMENT ===

# @router.get("/applications", response_model=List[Application])
# def list_all_applications(
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     return session.exec(select(Application)).all()

# @router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_application(
#     app_id: int,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     app_to_delete = session.get(Application, app_id)
#     if not app_to_delete:
#         raise HTTPException(status_code=404, detail="Application not found")

#     # ❗ Delete associated systems
#     for system in app_to_delete.systems:
#         session.delete(system)

#     # ❗ Delete associated runbooks
#     for runbook in app_to_delete.runbooks:
#         session.delete(runbook)

#     # ✅ Delete the application itself
#     session.delete(app_to_delete)
#     session.commit()
#     return {"ok": True}

# # === SYSTEM MANAGEMENT ===

# @router.get("/applications/{app_id}/systems", response_model=List[SystemResponse])
# def list_systems_for_application(
#     app_id: int,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     application = session.get(Application, app_id)
#     if not application:
#         raise HTTPException(status_code=404, detail="Application not found")
#     return application.systems

# @router.post("/applications/{app_id}/systems", response_model=SystemResponse)
# def create_system_for_application(
#     app_id: int,
#     system_data: SystemCreateAdmin,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     application = session.get(Application, app_id)
#     if not application:
#         raise HTTPException(status_code=404, detail="Application not found")

#     new_system = System.from_orm(system_data)
#     new_system.application_id = app_id

#     session.add(new_system)
#     session.commit()
#     session.refresh(new_system)
#     return new_system

# @router.delete("/systems/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_system(
#     system_id: int,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user)
# ):
#     system = session.get(System, system_id)
#     if not system:
#         raise HTTPException(status_code=404, detail="System not found")

#     session.delete(system)
#     session.commit()
#     return {"ok": True}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone

from app.database import get_session
from app.models.user import User
from app.models.application import Application
from app.models.system import System
from app.models.runbook import RunbookDocument
from app.schema import UserResponse, UserUpdate, SystemCreateAdmin, SystemResponse, SystemUpdate
from app.routers.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- Admin Auth Guard ---
def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges."
        )
    return current_user

# === USER MANAGEMENT ===

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    return session.exec(select(User)).all()

@router.post("/users", response_model=UserResponse)
def create_user(
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    if not user_data.email or not user_data.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    new_user = User(
        name=user_data.name or "New User",
        email=user_data.email,
        password=get_password_hash(user_data.password),
        role=user_data.role or "checker"
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

# === APPLICATION MANAGEMENT ===

@router.get("/applications", response_model=List[Application])
def list_all_applications(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    return session.exec(select(Application)).all()

@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    app_to_delete = session.get(Application, app_id)
    if not app_to_delete:
        raise HTTPException(status_code=404, detail="Application not found")

    for system in app_to_delete.systems:
        session.delete(system)

    for runbook in app_to_delete.runbooks:
        session.delete(runbook)

    session.delete(app_to_delete)
    session.commit()
    return {"ok": True}

# === SYSTEM MANAGEMENT ===

@router.get("/applications/{app_id}/systems", response_model=List[SystemResponse])
def list_systems_for_application(
    app_id: int,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application.systems

@router.post("/applications/{app_id}/systems", response_model=SystemResponse)
def create_system_for_application(
    app_id: int,
    system_data: SystemCreateAdmin,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    application = session.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    new_system = System.from_orm(system_data)
    new_system.application_id = app_id

    session.add(new_system)
    session.commit()
    session.refresh(new_system)
    return new_system

@router.delete("/systems/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_system(
    system_id: int,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    system = session.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    session.delete(system)
    session.commit()
    return {"ok": True}

# ✅ SYSTEM UPDATE for Admin
@router.patch("/systems/{system_id}/update", response_model=SystemResponse)
def update_system_admin(
    system_id: int,
    update: SystemUpdate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    system = session.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    system.dr_data = update.dr_data
    system.upstream_dependencies = update.upstream_dependencies
    system.downstream_dependencies = update.downstream_dependencies
    system.key_contacts = update.key_contacts
    system.source_reference = update.source_reference

    session.add(system)
    session.commit()
    session.refresh(system)
    return system

# ✅ SYSTEM APPROVE for Admin
@router.patch("/systems/{system_id}/approve", response_model=SystemResponse)
def approve_system_admin(
    system_id: int,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    system = session.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    system.is_approved = True
    system.approved_by = admin_user.name
    system.approved_at = datetime.now(timezone.utc)

    session.add(system)
    session.commit()
    session.refresh(system)
    return system
