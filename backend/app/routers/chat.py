from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
import os

# --- LlamaIndex Imports ---
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.query_engine import NLSQLTableQueryEngine
from llama_index.core import KnowledgeGraphIndex, StorageContext
from llama_index.core.graph_stores import SimpleGraphStore
from llama_index.core.tools import QueryEngineTool
from llama_index.core.selectors import PydanticSingleSelector

from llama_index.core import SQLDatabase, VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.llms.openai import OpenAI
from llama_index.core.settings import Settings


from app.database import get_session, engine
from app.models.application import Application
from app.models.user import User
from app.schema import ChatRequest, ChatResponse
from app.routers.auth import get_current_user


Settings.llm = OpenAI(model="gpt-3.5-turbo")

router = APIRouter(prefix="/chat", tags=["Chat"])


query_engine_cache = {}

def get_chat_query_engine(application_id: int):
    """
    Builds or retrieves from cache the agentic query engine for a specific application.
    """
    if application_id in query_engine_cache:
        print(f"Loading query engine for app {application_id} from cache.")
        return query_engine_cache[application_id]

    print(f"Building new query engine for app {application_id}...")
    
    # Database Tool
    sql_database = SQLDatabase(engine, include_tables=["system"])
    sql_query_engine = NLSQLTableQueryEngine(
        sql_database=sql_database,
        tables=["system"],

        context_str=f"The user is asking about systems related to application_id {application_id}. All SQL queries MUST include a WHERE clause to filter by application_id = {application_id}."
    )
    sql_tool = QueryEngineTool.from_defaults(
        query_engine=sql_query_engine,
        name="database_tool",
        description=(
            "Use this tool to answer questions about specific approved systems, "
            "their DR steps, dependencies, or approval status."
        ),
    )

    # TODO : RAG Tool 
    index_storage_path = f"./storage/app_{application_id}"
    if not os.path.exists(index_storage_path):
        # Handle case where index doesn't exist for this app
        return None 
        
    storage_context = StorageContext.from_defaults(persist_dir=index_storage_path)
    index = load_index_from_storage(storage_context)
    rag_query_engine = index.as_query_engine()
    rag_tool = QueryEngineTool.from_defaults(
        query_engine=rag_query_engine,
        name="runbook_tool",
        description=(
            "Use this tool to answer general questions about the runbook's content, "
            "like policies, overall procedures, or other contextual information."
        ),
    )

    # Router Agent
    query_engine = RouterQueryEngine.from_defaults(
        query_engine_tools=[sql_tool, rag_tool],
        selector=PydanticSingleSelector.from_defaults(),
    )
    
    query_engine_cache[application_id] = query_engine
    return query_engine

@router.post("/{application_id}/query", response_model=ChatResponse)
def chat_with_application(
    application_id: int,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Handles a chat query using an agentic router to choose the best data source.
    """
    application = session.get(Application, application_id)
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Application not found or access denied.")

    query_engine = get_chat_query_engine(application_id)
    if not query_engine:
        raise HTTPException(status_code=404, detail="Knowledge base for this application not yet created. Please run the extraction first.")

    print(f"Routing query: '{request.query}'")
    response = query_engine.query(request.query)
    
    # response.response
    return ChatResponse(answer=str(response))



@router.post("/{application_id}/graph-query", response_model=ChatResponse)
def chat_with_graph(
    application_id: int,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Answers questions about system dependencies by querying a knowledge graph.
    """
    application = session.get(Application, application_id)
    if not application or application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Application not found or access denied.")

    # 1. Dynamically build knowledge graph triplets from the database
    kg_triplets = []
    for system in application.systems:
        for dep in system.upstream_dependencies:
            kg_triplets.append((system.name, "depends on", dep))
        for dep in system.downstream_dependencies:
            # Note: A better relation might be "is a dependency for"
            kg_triplets.append((dep, "supports", system.name))
        
        status = "is approved" if system.is_approved else "is not approved"
        kg_triplets.append((system.name, "approval status is", status))

    if not kg_triplets:
        return ChatResponse(answer="No dependency information available to build a knowledge graph.")

    # 2. Create an in-memory knowledge graph for the query
    graph_store = SimpleGraphStore()
    for subj, rel, obj in kg_triplets:
        graph_store.upsert_triplet(subj, rel, obj)

    storage_context = StorageContext.from_defaults(graph_store=graph_store)

    index = KnowledgeGraphIndex(
        nodes=[], 
        storage_context=storage_context
    )

    # 3. Query the graph
    query_engine = index.as_query_engine(
        include_text=False, # We only want to query the graph structure
        response_mode="tree_summarize" # Can improve summary of multiple facts
    )
    response = query_engine.query(request.query)

    return ChatResponse(answer=str(response))