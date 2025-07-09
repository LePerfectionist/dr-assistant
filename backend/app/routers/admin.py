# # in app/routers/admin.py

# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlmodel import Session, select
# from typing import List

# from app.database import get_session
# from app.models.user import User
# from app.schema import UserResponse, UserUpdate
# # Import the authentication helpers we already built
# from app.routers.auth import get_current_user, get_password_hash

# router = APIRouter(prefix="/admin", tags=["Admin"])

# # --- Admin Dependency ---
# def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
#     """
#     A dependency that reuses get_current_user and then checks
#     if the user has the 'admin' role.
#     """
#     if current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="The user does not have administrative privileges."
#         )
#     return current_user

# # --- Admin Endpoints for User Management ---

# @router.get("/users", response_model=List[UserResponse])
# def get_all_users(
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user) # Protects the endpoint
# ):
#     """Lists all users. Only accessible by admins."""
#     users = session.exec(select(User)).all()
#     return users

# @router.patch("/users/{user_id}", response_model=UserResponse)
# def update_user(
#     user_id: int,
#     user_update: UserUpdate,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user) # Protects the endpoint
# ):
#     """Updates a user's details. Only accessible by admins."""
#     db_user = session.get(User, user_id)
#     if not db_user:
#         raise HTTPException(status_code=404, detail="User not found")

#     # Get the data from the Pydantic model
#     update_data = user_update.dict(exclude_unset=True)

#     # Hash the password if a new one was provided
#     if "password" in update_data:
#         db_user.password = get_password_hash(update_data["password"])
#         del update_data["password"] # Don't try to set it again

#     # Update the other fields
#     for key, value in update_data.items():
#         setattr(db_user, key, value)

#     session.add(db_user)
#     session.commit()
#     session.refresh(db_user)
#     return db_user

# @router.delete("/users/{user_id}")
# def delete_user(
#     user_id: int,
#     session: Session = Depends(get_session),
#     admin_user: User = Depends(get_current_admin_user) # Protects the endpoint
# ):
#     """Deletes a user. Only accessible by admins."""
#     user_to_delete = session.get(User, user_id)
#     if not user_to_delete:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     if user_to_delete.id == admin_user.id:
#         raise HTTPException(status_code=400, detail="Admins cannot delete their own account.")

#     session.delete(user_to_delete)
#     session.commit()
#     return {"ok": True, "detail": "User deleted successfully"}

# in app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.user import User
from app.models.application import Application
from app.models.runbook import RunbookDocument
from app.models.system import System
from app.schema import UserResponse, UserUpdate, SystemCreateAdmin, SystemResponse
from app.routers.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges."
        )
    return current_user

# === USER MANAGEMENT ===


@router.post("/users", response_model=UserResponse)
def create_user(
    user_data: UserUpdate, # Can use UserUpdate to create a user with specific role/pass
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Creates a new user with a specific role."""
    if not user_data.email or not user_data.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = User(
        name=user_data.name or "New User",
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role or "checker"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# === APPLICATION MANAGEMENT ===

@router.get("/applications", response_model=List[Application])
def list_all_applications(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Lists all applications from all users."""
    return session.exec(select(Application)).all()

@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user)
):
    """(Admin) Deletes an application and all its associated systems/runbooks."""
    app_to_delete = session.get(Application, app_id)
    if not app_to_delete:
        raise HTTPException(status_code=404, detail="Application not found")
    
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
    """(Admin) Lists all systems associated with a specific application."""
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
    """(Admin) Manually creates a system for an application, bypassing the LLM."""
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
    """(Admin) Deletes a single system."""
    system_to_delete = session.get(System, system_id)
    if not system_to_delete:
        raise HTTPException(status_code=404, detail="System not found")
    
    session.delete(system_to_delete)
    session.commit()
    return {"ok": True}