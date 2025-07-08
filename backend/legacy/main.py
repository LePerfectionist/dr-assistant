import os
import shutil
from typing import List, Dict
import json
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException
from dotenv import load_dotenv
from llama_index.core.memory import ChatMemoryBuffer


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
    get_llama_parser
)


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

#Global DR Steps cache
dr_memory: Dict[str, str] = {}

@app.post("/generate-dr-steps", response_model=DRStepsResponse)
async def generate_dr_steps(request: DRStepsRequest):
    print("Entering dr step generation")
    try:
        session_folder = f"runbooks"   #Ideally to be replaced by session upload dir
        context_text = extract_text_from_folder(session_folder)
        context_text = f"Runbook Context:\n\n{context_text}"

        systems_to_failover = [sys for sys, state in request.system_choices.items() if state == "Secondary"]

        if not systems_to_failover:
            return DRStepsResponse(dr_steps="No systems were selected for failover.", session_id=request.session_id)
        
        failover_systems = " and ".join(systems_to_failover)

        with open("prompts\\dr_steps_generation.txt", "r") as f:
            prompt_template = f.read()
        prompt = prompt_template.format(failover_systems=failover_systems)

        #Get response from either chat completion or embedding (comment out one)
        dr_steps_text = get_openai_chat_completion_repsonse(system_prompt=prompt, user_prompt=context_text)
        # dr_steps_text = get_query_engine().query(prompt).response

        dr_memory[request.session_id] = dr_steps_text
        #Add dr steps to index if needed
        # add_dr_steps_to_index(session_id, dr_steps_text)

        return DRStepsResponse(dr_steps=dr_steps_text, session_id=request.session_id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
    
systems_data_memory: Dict[str, str] = {}
    
@app.post("/extract_dr_systems", response_model=ExtractDRSystemsResponse)
async def extract_dr_systems(files: List[UploadFile] = File(...)):
    print("Entering extract dr systems")
    session_id = str(uuid4())
    embedding_path = "embeddings/manual_index"

    try:
        reuse_embeddings = True
        if not os.path.exists(embedding_path) or not reuse_embeddings:
            shutil.rmtree(embedding_path)
            await create_embedding(files, embedding_path)
        else:
            print("Embeddings already created")
        
        use_sample_systems_data = True
        if use_sample_systems_data:
            with open("systems_data\\systems_data_sample.json", "r") as f:
                systems_data = json.load(f)
        else:
            with open("prompts\\dr_systems_extraction.txt") as f:
                prompt = f.read()
            # response = get_query_engine(embedding_path).query(prompt).response
            full_text = extract_text("runbooks\\sample_runbook.docx")
            try:
                response = get_openai_chat_completion_repsonse(prompt, full_text)
                print("LLM call succesful\n", response[:15])
            except Exception as e:
                print("LLM call failed\n", e)
            if response:
                systems_data_memory[session_id] = response
                systems_data = extract_json_from_response(response)
            try:
                #Save systems data json against session_id
                with open(f"systems_data\\{session_id}.json", "w") as f:
                    json.dump(systems_data, f, indent=4)
            except json.JSONDecodeError as e:
                print("Could not decode JSON:", e)
                raise HTTPException(status_code=500, detail="Invalid JSON returned by model.")

        for i, system in enumerate(systems_data, start=1):
            print(f"{i}. {system}")
            print(systems_data[system], "\n")
            print(systems_data[system]["dr_data"], "\n")

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    return ExtractDRSystemsResponse(session_id=session_id, systems_data=systems_data)


@app.post("/extract_dr_systems")
async def extract_dr_systems():
    print("Entering extract dr systems")
    session_id = str(uuid4())

    llama_parser = LlamaParse(page_prefix="START OF PAGE: {pageNumber}\n",page_suffix="\nEND OF PAGE: {pageNumber}",api_key="",verbose=True,result_type="markdown")
    # Load the document again with the new parser settings
    file_name = "sample_runbook.docx"
    extra_info = {"file_name": file_name, "file_type": "docx"}

    documents = llama_parser.load_data("app\\runbooks\\sample_runbook.docx", extra_info=extra_info)
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

    print(f"Total number of relevant nodes: {len(relevant_nodes)}\n")
    
    with open("app\\prompts\\system_extraction_from_node.txt") as f:
        prompt_template = f.read()

    systems = []

    for i, node in enumerate(relevant_nodes, start=1):
        if i <10:
            prompt = prompt_template.format(text=node.text)
            response = get_openai_chat_completion_repsonse(user_prompt=prompt)
            parsed_data = extract_json_from_response(response)
            print("Parsed data:", parsed_data)
            if parsed_data["is_dr_section"]:
                system_data = System(
                    name = parsed_data["system_name"],
                    dr_data = parsed_data["dr_data"],
                    dependencies = parsed_data["dependencies"],
                    key_contacts = parsed_data["key_contacts"],
                    application_id = uuid4()
                )
                systems.append(system_data)
                print("System extracted:", system_data)
                break
    
    return systems

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from llama_parse import LlamaParse
from llama_index.core.node_parser import HierarchicalNodeParser, get_leaf_nodes

from app.database import get_session
from app.models.application import Application
from app.models.system import System
from app.schema import ChatRequest, ChatResponse
# Assuming you have these helper functions somewhere
from app.helpers import (
    get_markdown_node_parser,
    get_hierarchical_node_parser,
    get_openai_chat_completion_repsonse,
    extract_json_from_response,
    get_chat_engine
)
from llama_index.core.memory import ChatMemoryBuffer

chat_memory_store = {}
systems_data_memory = {}

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/chat", response_model=ChatResponse)
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