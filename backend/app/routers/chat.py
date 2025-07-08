from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import func
from typing import List

from app.database import get_session
from app.models.application import Application
from app.models.system import System
from app.models.user import User
from app.schema import ChatRequest, ChatResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/{application_id}/query", response_model=ChatResponse)
def chat_with_application(
    application_id: int,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Handles a chat query against a specific application's knowledge base.
    Phase 1: Queries the structured, approved 'systems' table.
    """
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    if application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot access this application.")

    # Try to extract a system name from the user's query.
    # This is a simple implementation; a real version might use an LLM for entity extraction.
    # For now, we assume the user's query *is* the system name.
    system_name_query = request.query.strip()

    # Query the database for the MOST RECENTLY APPROVED system matching the name
    # for this specific application run.
    statement = (
        select(System)
        .where(System.application_id == application_id)
        .where(func.lower(System.name) == func.lower(system_name_query)) # Case-insensitive search
        .order_by(System.approved_at.desc().nullslast()) # Prioritize approved systems
    )
    
    relevant_system = session.exec(statement).first()

    # --- Generate the response based on the database lookup ---
    
    if not relevant_system:
        # We will add RAG here in Phase 2. For now, we have no answer.
        return ChatResponse(answer="I couldn't find any information about that specific system in the validated database.")

    if relevant_system.is_approved:
        answer_text = (
            f"Here are the approved Disaster Recovery steps for '{relevant_system.name}':\n\n"
            f"DR Steps:\n{relevant_system.dr_data}\n\n"
            f"Dependencies: {', '.join(relevant_system.dependencies) or 'None listed'}\n"
            f"Key Contacts: {', '.join(relevant_system.key_contacts) or 'None listed'}"
        )
        return ChatResponse(
            answer=answer_text,
            source_reference=relevant_system.source_reference,
            is_approved=True,
            approved_at=relevant_system.approved_at
        )
    else:
        # The system was found but is not yet approved
        answer_text = (
            f"I found information for the system '{relevant_system.name}', but it has **NOT been approved** by a checker yet.\n\n"
            f"The unapproved data is as follows:\n{relevant_system.dr_data}"
        )
        return ChatResponse(
            answer=answer_text,
            source_reference=relevant_system.source_reference,
            is_approved=False
        )