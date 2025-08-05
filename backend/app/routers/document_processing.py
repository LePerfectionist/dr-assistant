from llama_index.core.node_parser import (
    MarkdownNodeParser,
    SentenceSplitter,
    HierarchicalNodeParser
)
from typing import List, Union

def process_any_document(runbook: RunbookDocument) -> List[Document]:
    """Universal processor for all document types"""
    raw_text = load_document_text(runbook)
    if not raw_text:
        return []

    # Detect document type
    is_markdown = "# " in raw_text[:100]  # Simple markdown detection
    is_technical = any(kw in raw_text.lower() for kw in ["procedure", "config", "failover"])

    # Choose parser based on content
    if is_markdown:
        parser = MarkdownNodeParser()
    elif is_technical:
        parser = HierarchicalNodeParser()  # Better for technical docs
    else:
        parser = SentenceSplitter(chunk_size=512)  # Default for plain text

    nodes = parser.get_nodes_from_documents([Document(text=raw_text)])
    
    # Universal metadata enhancement
    return [
        Document(
            text=node.text,
            metadata={
                **node.metadata,
                "doc_type": "markdown" if is_markdown else "technical" if is_technical else "general",
                "filename": runbook.filename,
                "application_id": runbook.application_id
            }
        )
        for node in nodes
    ]