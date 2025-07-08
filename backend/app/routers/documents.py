from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session
import os
import shutil
from app.database import get_session
from app.models.application import Application
from app.models.runbook import RunbookDocument
from app.models.user import User
from app.schema import ApplicationResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])
UPLOAD_DIRECTORY = "app/runbooks_uploaded"

@router.post("/upload", response_model=ApplicationResponse)
def upload_runbook(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    # Get the user from the auth token instead of a form field
    current_user: User = Depends(get_current_user) 
):
    """
    Handles uploading a runbook file.
    1. Verifies the user exists.
    2. Creates an Application and a RunbookDocument record.
    3. Saves the file to a designated folder.
    """

    # 2. Create Application record
    new_application = Application(user_id=current_user.id)
    session.add(new_application)
    session.commit()
    session.refresh(new_application) # Get the new application ID

    # 3. Save the file
    os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIRECTORY, f"app_{new_application.id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Create RunbookDocument record
    new_runbook = RunbookDocument(
        filename=file.filename,
        storage_path=file_path,
        application_id=new_application.id
    )
    session.add(new_runbook)
    session.commit()
    session.refresh(new_application) # Refresh to load the runbook relationship

    return new_application