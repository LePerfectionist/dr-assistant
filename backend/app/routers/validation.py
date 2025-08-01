from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import os
from pathlib import Path
from app.database import get_session
from app.models.system import System, SystemType, SystemSource
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.update_requests import UpdateRequest
from app.models.runbook import RunbookDocument
from app.schema import SystemResponse, SystemUpdate, ApplicationResponse, SystemCreateAdmin, RequestStatus, UpdateRequestResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/validation", tags=["Validation"])
UPLOAD_DIR = "app/runbooks_uploaded"

@router.post("/upload_documents/")
async def upload_documents(
    app_name: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Application name cannot be empty.")

    new_app = Application(user_id=user.id, name=name)
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    systems_created = []
    
    for file in files:
        try:
            contents = await file.read()
            
            # Save file
            file_path = os.path.join(UPLOAD_DIR, f"{new_app.name}/{file.filename}")
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
            
            # Create runbook record
            runbook = RunbookDocument(
                filename=file.filename,
                storage_path=file_path,
                application_id=new_app.id
            )
            db.add(runbook)
            
            # Extract actual system data from document
            extracted_data = extract_system_data_from_doc(contents)  # Implement this function
            
            # Create system with extracted data
            system = System(
                name=extracted_data.get('system_name', name),  # Use extracted name or fallback to app name
                dr_data=extracted_data.get('dr_data', f"DR data from {file.filename}"),
                upstream_dependencies=extracted_data.get('upstream_dependencies', []),
                downstream_dependencies=extracted_data.get('downstream_dependencies', []),
                key_contacts=extracted_data.get('key_contacts', []),
                source_reference=file.filename,
                application_id=new_app.id,
                uploaded_by=user.id,
                source=SystemSource.AUTO_EXTRACTED,
                system_type=extracted_data.get('system_type', SystemType.INTERNAL)
            )
            db.add(system)
            systems_created.append(system)

        except Exception as e:
            print(f"Error processing file {file.filename}: {str(e)}")
            continue

    db.commit()
    
    return {
        "message": "Upload successful",
        "application_id": new_app.id,
        "systems": [{
            "id": s.id,
            "name": s.name,
            "dr_data": s.dr_data,
            "upstream_dependencies": s.upstream_dependencies,
            "downstream_dependencies": s.downstream_dependencies,
            "key_contacts": s.key_contacts,
            "system_type": s.system_type,
            "source_reference": s.source_reference
        } for s in systems_created]
    }
# Ensure upload directory exists
Path(UPLOAD_DIR).mkdir(exist_ok=True)


@router.get("/applications", response_model=List[ApplicationResponse])
def list_user_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    try:
        stmt = (
            select(Application)
            .where(Application.user_id == current_user.id)
            .options(
                joinedload(Application.user),
                joinedload(Application.runbooks)
            )
        )
        
        result = db.execute(stmt).unique().all()
        applications = [app for (app,) in result]
        
        response = []
        for app in applications:
            # Ensure we're using the actual application name
            app_name = app.name if app.name and app.name.strip() != "" else "Unnamed Application"
            
            response.append({
                "id": app.id,
                "name": app_name,  # Use the properly checked name
                "user_id": app.user_id,
                "user_name": app.user.name if app.user else "Unknown",
                "started_at": app.started_at.isoformat(),
                "last_updated": app.last_updated.isoformat(),
                "runbooks": [
                    {
                        "id": r.id,
                        "filename": r.filename
                    } for r in app.runbooks
                ] if hasattr(app, 'runbooks') and app.runbooks else []
            })
        
        return response

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch applications: {str(e)}"
        )
    

@router.post("/applications", response_model=ApplicationResponse)
async def create_application(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        # Create application with name
        application = Application(name=name, user_id=current_user.id)
        db.add(application)
        db.commit()
        db.refresh(application)

        # Save file to uploads directory
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Create runbook record
        runbook = RunbookDocument(
            filename=file.filename,
            storage_path=file_path,
            application_id=application.id
        )
        db.add(runbook)
        db.commit()
        db.refresh(runbook)

        return application_to_response(db, application)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Application creation failed: {str(e)}")

@router.get("/applications/{app_id}/systems", response_model=List[SystemResponse])
def list_systems_for_app(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    application = db.get(Application, app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this application")
    
    return db.exec(select(System).where(System.application_id == app_id)).all()

@router.post("/applications/{app_id}/systems/external", response_model=SystemResponse)
def create_external_system(
    app_id: int,
    system_data: SystemCreateAdmin,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        application = db.get(Application, app_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if application.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to modify this application")
        
        existing_system = db.exec(
            select(System)
            .where(System.application_id == app_id)
            .where(System.name == system_data.name)
        ).first()
        
        if existing_system:
            raise HTTPException(
                status_code=400,
                detail=f"System with name '{system_data.name}' already exists in this application"
            )
        
        external_system = System(
            name=system_data.name,
            application_id=app_id,
            system_type=system_data.system_type,
            source=SystemSource.MANUALLY_CREATED,
            dr_data=system_data.dr_data or f"Manually created external system: {system_data.name}",
            upstream_dependencies=system_data.upstream_dependencies or [],
            downstream_dependencies=system_data.downstream_dependencies or [],
            key_contacts=system_data.key_contacts or [],
            source_reference=system_data.source_reference or "Manually created external system",
            uploaded_by=current_user.name
        )
        
        db.add(external_system)
        db.commit()
        db.refresh(external_system)
        
        return external_system

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/systems/{system_id}/update", response_model=SystemResponse)
def update_system(
    system_id: int,
    system_update_data: SystemUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        system = db.get(System, system_id)
        if not system:
            raise HTTPException(status_code=404, detail="System not found.")
        
        parent_application = system.application
        if parent_application.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to modify this system")
        
        all_system_names_in_app = {s.name for s in parent_application.systems}

        for dep_field in ['upstream_dependencies', 'downstream_dependencies']:
            if getattr(system_update_data, dep_field) is not None:
                updated_deps = []
                for dep_name in getattr(system_update_data, dep_field):
                    if dep_name and dep_name not in all_system_names_in_app:
                        if system_update_data.force_external:
                            existing = db.exec(
                                select(System)
                                .where(System.name == dep_name)
                                .where(System.application_id == parent_application.id)
                            ).first()
                            
                            if not existing:
                                external_system = System(
                                    name=dep_name,
                                    application_id=parent_application.id,
                                    system_type=SystemType.EXTERNAL,
                                    source=SystemSource.AUTO_EXTRACTED,
                                    dr_data=f"Auto-created external system: {dep_name}",
                                    source_reference="Auto-created from dependency"
                                )
                                db.add(external_system)
                                db.commit()
                                db.refresh(external_system)
                                all_system_names_in_app.add(dep_name)
                        else:
                            raise HTTPException(
                                status_code=400,
                                detail=f"{dep_field.replace('_', ' ').title()} '{dep_name}' not found in application. "
                                       "Set force_external=true to proceed with external dependencies."
                            )
                    updated_deps.append(dep_name)
                setattr(system, dep_field, updated_deps)

        if system_update_data.dr_data is not None:
            system.dr_data = system_update_data.dr_data
        if system_update_data.system_type is not None:
            system.system_type = system_update_data.system_type
        if system_update_data.key_contacts is not None:
            system.key_contacts = system_update_data.key_contacts
        if system_update_data.source_reference is not None:
            system.source_reference = system_update_data.source_reference

        db.add(system)
        db.commit()
        db.refresh(system)
        return system

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/systems/{system_id}/approve", response_model=SystemResponse)
def approve_system(
    system_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        system = db.get(System, system_id)
        if not system:
            raise HTTPException(status_code=404, detail="System not found.")

        parent_application = system.application
        if parent_application.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to approve this system")

        now = datetime.now(timezone.utc)
        system.is_approved = True
        system.approved_by = current_user.name
        system.approved_at = now
        system.reapproval_due_at = now + timedelta(minutes=1)  # Changed to 5 minutes for testing
        
        print(f"\nApproving system {system_id}:")
        print(f"Approved at: {system.approved_at}")
        print(f"Reapproval due at: {system.reapproval_due_at}\n")
        
        db.add(system)
        db.commit()
        db.refresh(system)
        return system

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/systems/{system_id}/status")
def get_system_status(
    system_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    system = db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found.")
    
    parent_application = system.application
    if parent_application.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this system")

    current_time = datetime.now(timezone.utc)
    reapproval_due_at = system.reapproval_due_at
    
    # Ensure timezone awareness
    if reapproval_due_at and reapproval_due_at.tzinfo is None:
        reapproval_due_at = reapproval_due_at.replace(tzinfo=timezone.utc)

    print(f"\nStatus check for system {system_id}:")
    print(f"Current time: {current_time}")
    print(f"Reapproval due at: {reapproval_due_at}")
    
    status = "Pending"
    if system.is_approved:
        if reapproval_due_at is None:
            status = "Approved (No Reapproval Set)"
        elif current_time > reapproval_due_at:
            status = "Due for Reapproval"
        else:
            status = "Approved"
            print(f"Time remaining: {reapproval_due_at - current_time}")
    
    print(f"Final status: {status}\n")
    
    return {
        "status": status,
        "is_approved": system.is_approved,
        "system_name": system.name,
        "approved_by": system.approved_by,
        "approved_at": system.approved_at.isoformat() if system.approved_at else None,
        "reapproval_due_at": reapproval_due_at.isoformat() if reapproval_due_at else None,
        "current_time": current_time.isoformat(),
        "time_remaining": str(reapproval_due_at - current_time) if reapproval_due_at else None
    }


# Checker Update Request handling endpoints

def get_current_checker(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure the user is a Checker or an Admin."""
    if current_user.role not in [UserRole.CHECKER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403, 
            detail="You do not have permission to perform this action."
        )
    return current_user


@router.get("/update-requests", response_model=List[UpdateRequestResponse])
def get_open_update_requests(
    session: Session = Depends(get_session),
    checker: User = Depends(get_current_checker)
):
    """
    (Checker) Gets a list of all update requests that are currently 'open'.
    """
    statement = (
        select(UpdateRequest)
        .where(UpdateRequest.status == RequestStatus.OPEN)
        .options(
            joinedload(UpdateRequest.system), 
            joinedload(UpdateRequest.requested_by_user)
        )
        .order_by(UpdateRequest.created_at.asc())
    )
    requests = session.exec(statement).all()
    return requests


@router.patch("/update-requests/{request_id}/status", response_model=UpdateRequestResponse)
def update_request_status(
    request_id: int,
    new_status: RequestStatus, # The new status is sent in the request body
    session: Session = Depends(get_session),
    checker: User = Depends(get_current_checker)
):
    """
    (Checker) Updates the status of an update request (e.g., to 'in_progress' or 'closed').
    """
    update_request = session.get(UpdateRequest, request_id)
    if not update_request:
        raise HTTPException(status_code=404, detail="Update request not found.")

    update_request.status = new_status
    
    session.add(update_request)
    session.commit()
    session.refresh(update_request)
    
    # To return the full nested response, we need to eager load relationships again
    # after the refresh. A bit redundant but necessary for a full response.
    db_request = session.exec(
        select(UpdateRequest)
        .where(UpdateRequest.id == request_id)
        .options(
            joinedload(UpdateRequest.system), 
            joinedload(UpdateRequest.requested_by_user)
        )
    ).one()
    
    return db_request