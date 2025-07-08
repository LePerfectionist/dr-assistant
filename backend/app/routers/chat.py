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