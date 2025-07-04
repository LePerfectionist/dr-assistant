import os
import tempfile
from docx import Document
import pdfplumber
from openai import OpenAI as OpenAIClient
from dotenv import load_dotenv
from llama_parse import LlamaParse
from llama_index.core.node_parser import MarkdownElementNodeParser
from llama_index.core.node_parser import HierarchicalNodeParser
from llama_index.core import (
    load_index_from_storage,
    VectorStoreIndex,
    StorageContext,
)
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI as LlamaOpenAI

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY is not set in .env file")

llm = LlamaOpenAI(model="gpt-4o", api_key=openai_api_key)
Settings.llm = llm
openai_client = OpenAIClient(api_key=openai_api_key)

llama_cloud_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
if not llama_cloud_api_key:
    raise ValueError("LLAMA_CLOUD_API_KEY is not set in .env file")


llama_parser = LlamaParse(result_type="markdown", api_key=llama_cloud_api_key)
node_parser = HierarchicalNodeParser.from_defaults()
documents = llama_parser.load_data("runbooks\sample_runbook.docx")

nodes = node_parser.get_nodes_from_documents(documents)


relevant_nodes = []
keywords = ["DR", "disaster", "recovery", "failover", "fallback", "redundant"]

for node in nodes:
    if any(kw.lower() in node.text.lower() for kw in keywords):
        relevant_nodes.append(node)

for i, node in enumerate(relevant_nodes, start=1):
    print(f"{i}. {node.text[:50]}...")  # Print first 50 characters of each node text
    print(node.metadata)