from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Optional, Dict, List
from app.database import get_session
from app.models import Application, User, RunbookDocument, System
from app.schema import ChatRequest, ChatResponse
from app.routers.auth import get_current_user
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.schema import Document
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine, TransformQueryEngine
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.core.node_parser import MarkdownNodeParser, HierarchicalNodeParser
import os
import logging
import re
from uuid import uuid4

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)

# Configure LlamaIndex settings
Settings.chunk_size = 512
Settings.chunk_overlap = 50

# Memory store for conversations
conversation_memory: Dict[str, ChatMemoryBuffer] = {}

def load_document_text(runbook: RunbookDocument) -> Optional[str]:
    """Universal document loader with encoding fallback"""
    try:
        with open(runbook.storage_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(runbook.storage_path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to load {runbook.filename}: {str(e)}")
            return None

def create_application_index(
    application: Application, 
    include_documents: bool = True,
    include_systems: bool = True
) -> Optional[VectorStoreIndex]:
    """Enhanced index creator with document type awareness"""
    documents = []
    
    # Process documents
    if include_documents and application.runbooks:
        for runbook in application.runbooks:
            content = load_document_text(runbook)
            if not content:
                continue
                
            # Auto-detect document type
            is_markdown = bool(re.search(r'^#\s+.+$', content, re.MULTILINE))
            is_technical = any(kw in content.lower() for kw in ["procedure", "config", "failover"])
            
            # Choose parser based on content
            parser = (MarkdownNodeParser() if is_markdown else 
                     HierarchicalNodeParser() if is_technical else 
                     None)
            
            doc = Document(
                text=content,
                metadata={
                    "doc_type": "markdown" if is_markdown else "technical" if is_technical else "general",
                    "filename": runbook.filename,
                    "application_id": application.id
                }
            )
            documents.append(doc)

    # Add systems information
    if include_systems and application.systems:
        systems_text = "\n\n".join([
            f"System: {system.name}\nType: {system.system_type}\n"
            f"DR Steps: {system.dr_data}\nDependencies: {system.upstream_dependencies}"
            for system in application.systems
        ])
        documents.append(Document(
            text=systems_text,
            metadata={"doc_type": "systems"}
        ))

    return VectorStoreIndex.from_documents(documents) if documents else None

def get_conversation_memory(conversation_id: str) -> ChatMemoryBuffer:
    """Get or create conversation memory"""
    if conversation_id not in conversation_memory:
        conversation_memory[conversation_id] = ChatMemoryBuffer.from_defaults(
            token_limit=3000
        )
    return conversation_memory[conversation_id]

@router.post("/query", response_model=ChatResponse)
async def chat_with_application(
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        # Get or create conversation ID
        conversation_id = request.conversation_id or str(uuid4())
        memory = get_conversation_memory(conversation_id)

        # Get application
        application = session.exec(
            select(Application)
            .where(Application.user_id == current_user.id)
            .order_by(Application.created_at.desc())
            .limit(1)
        ).first()
        
        if not application:
            return ChatResponse(
                answer="❌ Please upload a document first.",
                conversation_id=conversation_id
            )

        # Create index
        index = create_application_index(application)
        if not index:
            return ChatResponse(
                answer="❌ No searchable content found.",
                conversation_id=conversation_id
            )

        # Create query engine with memory
        query_engine = index.as_query_engine(
            memory=memory,
            response_mode="tree_summarize",
            similarity_top_k=3,
            verbose=True
        )
        
        response = query_engine.query(request.query)
        return ChatResponse(
            answer=str(response),
            conversation_id=conversation_id,
            sources=[node.metadata.get("filename", "Unknown") for node in response.source_nodes]  # Optional: include sources
        )
        
    except Exception as e:
        logger.exception("Chat endpoint failed")
        return ChatResponse(
            answer=f"⚠️ Error: {str(e)}",
            conversation_id=conversation_id if 'conversation_id' in locals() else None
        )