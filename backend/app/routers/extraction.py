from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from llama_parse import LlamaParse
from llama_index.core.node_parser import HierarchicalNodeParser, get_leaf_nodes

from app.database import get_session
from app.models.application import Application
from app.models.system import System
from app.schema import SystemResponse
# Assuming you have these helper functions somewhere
from app.helpers import (
    get_markdown_node_parser,
    get_hierarchical_node_parser,
    get_openai_chat_completion_repsonse,
    extract_json_from_response
)

router = APIRouter(prefix="/extraction", tags=["Extraction"])

@router.post("/{application_id}/extract_systems", response_model=List[SystemResponse])
def extract_dr_systems(application_id: int, session: Session = Depends(get_session)):
    """
    Extracts DR systems from the runbook associated with a given Application ID.
    """
    # 1. Get the Application and its Runbook
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    if not application.runbooks:
        raise HTTPException(status_code=400, detail="No runbook found for this application.")

    runbook = application.runbooks[0] # Assuming one runbook per application for now
    
    llama_parser = LlamaParse(page_prefix="START OF PAGE: {pageNumber}\n",page_suffix="\nEND OF PAGE: {pageNumber}",api_key="",verbose=True,result_type="markdown")
    documents = llama_parser.load_data(runbook.storage_path)
    for i, doc in enumerate(documents, start=1):
        doc.metadata["page_number"] = i
    # node_parser = get_markdown_node_parser()
    node_parser = get_hierarchical_node_parser()

    nodes = node_parser.get_nodes_from_documents(documents)
    leaf_nodes = get_leaf_nodes(nodes)
    print(f"Total number of nodes parsed: {len(nodes)}\n")

    relevant_nodes = []
    keywords = ["DR", "disaster", "recovery", "failover", "fallback", "redundant"]
    for node in leaf_nodes:
        if any(kw.lower() in node.text.lower() for kw in keywords):
            relevant_nodes.append(node)
    
    print(f"Found {len(relevant_nodes)} relevant nodes.")

    # 4. Process nodes and save to DB
    with open("app/prompts/system_extraction_from_node.txt") as f:
        prompt_template = f.read()

    newly_created_systems = []
    for node in relevant_nodes:
        prompt = prompt_template.format(text=node.text)
        response = get_openai_chat_completion_repsonse(user_prompt=prompt)
        parsed_data = extract_json_from_response(response)

        if parsed_data and parsed_data.get("is_dr_section"):
            system_to_create = System(
                name=parsed_data.get("system_name", "Unknown System"),
                dr_data=parsed_data.get("dr_data", ""),
                dependencies=parsed_data.get("dependencies", []),
                key_contacts=parsed_data.get("key_contacts", []),
                application_id=application_id,
                source_reference=f"File: {runbook.filename}, Page Number: {node.metadata['page_number']}, Section near text: '{node.text[:50]}...'"
            )
            session.add(system_to_create)
            newly_created_systems.append(system_to_create)

    if newly_created_systems:
        session.commit()
        for system in newly_created_systems:
            session.refresh(system) # Ensure IDs are loaded back

    # Return all systems for this application, including any pre-existing ones.
    return application.systems