# in app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models.user import User
from app.schema import UserResponse, UserUpdate
# Import the authentication helpers we already built
from app.routers.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- Admin Dependency ---
def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    A dependency that reuses get_current_user and then checks
    if the user has the 'admin' role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges."
        )
    return current_user

# --- Admin Endpoints for User Management ---

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user) # Protects the endpoint
):
    """Lists all users. Only accessible by admins."""
    users = session.exec(select(User)).all()
    return users

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user) # Protects the endpoint
):
    """Updates a user's details. Only accessible by admins."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get the data from the Pydantic model
    update_data = user_update.dict(exclude_unset=True)

    # Hash the password if a new one was provided
    if "password" in update_data:
        db_user.password = get_password_hash(update_data["password"])
        del update_data["password"] # Don't try to set it again

    # Update the other fields
    for key, value in update_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_current_admin_user) # Protects the endpoint
):
    """Deletes a user. Only accessible by admins."""
    user_to_delete = session.get(User, user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account.")

    session.delete(user_to_delete)
    session.commit()
    return {"ok": True, "detail": "User deleted successfully"}