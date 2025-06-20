import os
import shutil
from typing import List, Dict, Any
import json
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from openai import OpenAI as OpenAIClient
from dotenv import load_dotenv

from llama_index.core.memory import ChatMemoryBuffer

from llama_index.core.memory import Memory
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI as LlamaOpenAI

from helpers import(
    extract_text_from_folder, 
    create_embedding, 
    add_dr_steps_to_index, 
    get_query_engine,
    get_openai_chat_completion_repsonse,
    get_chat_engine

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

class SystemChoice(BaseModel):
    system_name: str
    state: str

class DRStepsRequest(BaseModel):
    session_id: str
    system_choices: Dict[str, str]

class DRStepsResponse(BaseModel):
    dr_steps: str
    session_id: str

class ChatRequest(BaseModel):
    session_id: str
    question: str
    include_dr_context: bool

class ChatResponse(BaseModel):
    answer: str


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


#Global DR Steps cache
dr_memory: Dict[str, str] = {}

@app.post("/generate-dr-steps", response_model=DRStepsResponse)
async def generate_dr_plan(request: DRStepsRequest):
    print("Entering dr step generation")
    try:
        session_folder = f"runbooks"   #Ideally to be replaced by session upload dir
        context_text = extract_text_from_folder(session_folder)
        context_text = f"Runbook Context:\n\n{context_text}"

        systems_to_failover = [sys for sys, state in request.system_choices.items() if state == "Secondary"]

        if not systems_to_failover:
            return DRStepsResponse(dr_steps="No systems were selected for failover.", session_id=request.session_id)
        
        failover_systems = " and ".join(systems_to_failover)

        with open("prompt.txt", "r") as f:
            prompt_template = f.read()
        prompt = prompt_template.format(failover_systems=failover_systems)

        #Get response from either chat completion or embedding (comment out one)
        dr_steps_text = get_openai_chat_completion_repsonse(prompt, context_text)
        # dr_steps_text = get_query_engine().query(prompt).response

        dr_memory[request.session_id] = dr_steps_text
        #Add dr steps to index if needed
        # add_dr_steps_to_index(session_id, dr_steps_text)

        return DRStepsResponse(dr_steps=dr_steps_text, session_id=request.session_id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


dr_context_injected = set()


chat_memory_store = {}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    print("Chat endpoint hit")
    try:
        # Per-session memory
        if request.session_id not in chat_memory_store:
            chat_memory_store[request.session_id] = ChatMemoryBuffer(token_limit=1500)
        memory = chat_memory_store[request.session_id]

        system_prompt = ""
        if (
            request.include_dr_context 
            and request.session_id in dr_memory
        ):
            system_prompt = f"DR Steps to be used as context:\n\n{dr_memory[request.session_id]}"

        chat_engine = get_chat_engine(memory, system_prompt)


        response = chat_engine.chat(request.question).response
        return ChatResponse(answer=response)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


    
