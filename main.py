import os
import io
import tempfile
import shutil
from typing import List, Dict, Any
import json
from uuid import uuid4
from docx import Document
import pdfplumber
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from openai import OpenAI as OpenAIClient
from dotenv import load_dotenv


from llama_parse import LlamaParse
from llama_index.core import VectorStoreIndex
from llama_index.llms.openai import OpenAI
from llama_index.core.node_parser import MarkdownElementNodeParser
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core import (
    load_index_from_storage,
    VectorStoreIndex,
    StorageContext,
)
from llama_index.core.memory import Memory
from llama_index.core.llms import ChatMessage
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI as LlamaOpenAI



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

# Initialize OpenAI clients
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY is not set in .env file")

llm = LlamaOpenAI(model="gpt-4o", api_key=openai_api_key)
Settings.llm = llm
openai_client = OpenAIClient(api_key=openai_api_key)

llama_cloud_api = os.getenv("LLAMA_CLOUD_API_KEY")
if not llama_cloud_api:
    raise ValueError("LLAMA_CLOUD_API is not set in .env file")

llm = OpenAI(model="gpt-4o", api_key=openai_api_key)

class DRStepsResponse(BaseModel):
    dr_steps: str
    session_id: str

class ChatRequest(BaseModel):
    session_id: str
    question: str
    include_dr_context: bool


class ChatResponse(BaseModel):
    answer: str

def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".doc":
        raise ValueError(".doc format not supported directly; use .docx instead.")
    else:
        raise ValueError("Unsupported file format: " + ext)

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text.strip()

def extract_text_from_docx(docx_path: str) -> str:
    doc = Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs]).strip()

async def create_embedding(uploaded_files, persist_dir="embeddings/runbooks_index"):
    all_nodes = []

    llama_parser = LlamaParse(result_type="markdown", api_key=llama_cloud_api)
    node_parser = MarkdownElementNodeParser(llm=llm, num_workers=15)

    for file in uploaded_files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        documents = llama_parser.load_data(tmp_path)
        for doc in documents:
            doc.metadata["source"] = file.filename

        nodes = node_parser.get_nodes_from_documents(documents)
        base_nodes, objects = node_parser.get_nodes_and_objects(nodes)

        all_nodes.extend(base_nodes)
        all_nodes.extend(objects)

        os.unlink(tmp_path)

    print("Total nodes to index:", len(all_nodes))
    index = VectorStoreIndex(all_nodes)
    index.storage_context.persist(persist_dir)

    return persist_dir

@app.post("/upload_runbooks")
async def upload_runbooks(files: List[UploadFile] = File(...)):
    session_id = str(uuid4())
    embedding_path = "embeddings/runbooks_index"
    if os.path.exists(embedding_path):
        shutil.rmtree(embedding_path)

    await create_embedding(files, embedding_path)

    return {"session_id": session_id}

    

#Global DR Steps cache
dr_memory: Dict[str, str] = {}

@app.post("/generate-dr-steps", response_model=DRStepsResponse)
async def generate_dr_plan(
    session_id: str = Form(...),
    system_choices: str = Form(...),
):
    try:
        session_folder = f"runbooks"   #Ideally to be replaced by session upload dir
        file_paths = [
            os.path.join(session_folder, filename)
            for filename in os.listdir(session_folder)
            if os.path.isfile(os.path.join(session_folder, filename))
        ]
        context_text = ""
        for path in file_paths:
            context_text += extract_text(path) + "\n\n"
        choices_dict = json.loads(system_choices)
        systems_to_failover = [sys for sys, state in choices_dict.items() if state == "Secondary"]
        
        if not systems_to_failover:
            return DRStepsResponse(dr_steps="No systems were selected for failover.")
        
        failover_systems = " and ".join(systems_to_failover)

        with open("prompt.txt", "r") as f:
            prompt_template = f.read()

        prompt = prompt_template.format(failover_systems=failover_systems)


        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Runbook Context:\n\n{context_text}"}
            ],
            temperature=0.5,
        )

        dr_steps_text = completion.choices[0].message.content.strip()

        dr_memory[session_id] = dr_steps_text
        return DRStepsResponse(dr_steps=dr_steps_text, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_query_engine(embedding_path="embeddings/runbooks_index"):
    storage_context = StorageContext.from_defaults(persist_dir=embedding_path)
    vectorstore = load_index_from_storage(storage_context=storage_context)
    print("Docs in index:", len(vectorstore.docstore.docs))
    query_engine = vectorstore.as_query_engine(similarity_top_k=5)

    return query_engine


dr_context_injected = set()


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
):
    try:
        query_engine = get_query_engine()
        if query_engine:
            print("Query engine loaded")
        memory = Memory.from_defaults(session_id=request.session_id, token_limit=4000)
        if memory:
            print("Memory loaded")
        if (
            request.include_dr_context 
            and request.session_id in dr_memory 
            and request.session_id not in dr_context_injected
        ):
            memory.put_messages([ChatMessage(role="system", content=f"DR Steps to be used as context:\n\n```{dr_memory[request.session_id]}```")])
            dr_context_injected.add(request.session_id)
            print("DR context added to memory")
            print("DR Steps generated", dr_memory[request.session_id][:15])
        memory.put_messages([ChatMessage(role="user", content=request.question)])
        response = query_engine.query(request.question).response
        print("Response", response)
        memory.put_messages([ChatMessage(role="assistant", content=str(response))])
        
        return ChatResponse(answer=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
