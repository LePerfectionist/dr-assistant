import os
import shutil
from typing import List, Dict
import json
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException
from dotenv import load_dotenv
from llama_index.core.memory import ChatMemoryBuffer
from llama_parse import LlamaParse
from llama_index.core.node_parser import get_leaf_nodes


from schema import(
    DRStepsRequest,
    DRStepsResponse,
    ExtractDRSystemsResponse,
    ChatRequest,
    ChatResponse)

from helpers import(
    extract_text,
    extract_text_from_folder, 
    create_embedding, 
    get_openai_chat_completion_repsonse,
    get_chat_engine,
    extract_json_from_response,
    get_hierarchical_node_parser,
    get_llama_parser,
    get_markdown_node_parser
)

from models import System

# --- Initial Setup ---
load_dotenv()

app = FastAPI(title="DR GenAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload_runbooks")
async def upload_runbooks(files: List[UploadFile] = File(...)):
    print("Entering upload runbooks")
    session_id = str(uuid4())
    embedding_path = "embeddings/runbooks_index"
    try:
        if not os.path.exists(embedding_path):
            await create_embedding(files, embedding_path)
        else:
            print("Embeddings already created")
        # if os.path.exists("embeddings/runbooks_index"):
        #     shutil.rmtree("embeddings/runbooks_index")

        # await create_embedding(files, embedding_path)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    return {"session_id": session_id}





@app.post("/extract_dr_systems")
async def extract_dr_systems():
    print("Entering extract dr systems")
    session_id = str(uuid4())

    llama_parser = LlamaParse(page_prefix="START OF PAGE: {pageNumber}\n",page_suffix="\nEND OF PAGE: {pageNumber}",api_key="",verbose=True,result_type="markdown")
    # Load the document again with the new parser settings
    file_name = "sample_runbook.docx"
    extra_info = {"file_name": file_name, "file_type": "docx"}

    documents = llama_parser.load_data("./runbooks/sample_runbook.docx", extra_info=extra_info)
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
    
    with open("prompts\\system_extraction_from_node.txt") as f:
        prompt_template = f.read()

    systems = []

    for node in relevant_nodes:
        prompt = prompt_template.format(text=node.text)
        response = get_openai_chat_completion_repsonse(user_prompt=prompt)
        parsed_data = extract_json_from_response(response)
        if parsed_data["is_dr_section"]:
            system_data = System(
                name = parsed_data["system_name"],
                dr_data = parsed_data["dr_data"],
                dependencies = parsed_data["dependencies"],
                key_contacts = parsed_data["key_contacts"],
                application_id = uuid4()
            )
            systems.append(system_data)
    
    return systems


@app.post("/validate_systems", response_model=ExtractDRSystemsResponse)
async def validate_systems(files: List[UploadFile] = File(...)):
    0
    
chat_memory_store = {}
systems_data_memory = {}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    print("Chat endpoint hit")
    try:
        # Per-session memory
        if request.session_id not in chat_memory_store:
            chat_memory_store[request.session_id] = ChatMemoryBuffer(token_limit=1500)
        memory = chat_memory_store[request.session_id]

        system_prompt = ""
        # if (
        #     request.include_dr_context 
        #     and request.session_id in dr_memory
        # ):
        #     system_prompt = f"DR Steps to be used as context:\n\n{dr_memory[request.session_id]}"
        if (
            request.include_dr_context 
            and request.session_id in systems_data_memory
        ):
            system_prompt = f"DR Systems to be used as context:\n\n{systems_data_memory[request.session_id]}"


        chat_engine = get_chat_engine(memory, system_prompt)


        response = chat_engine.chat(request.question).response
        return ChatResponse(answer=response)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    


    

   

    
