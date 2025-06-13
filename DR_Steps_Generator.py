import streamlit as st
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.chains.question_answering import load_qa_chain
from langchain.callbacks import get_openai_callback
import os
import json
from openai import OpenAI

from file_processing import get_responses, extract_text, get_chatbot_chain

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

if not openai_api_key:
    st.error("🔴 OpenAI API key not found. Please set the OPENAI_API_KEY in your .env file and restart the app.")

# Title and Sidebar Configuration
logo_url = "https://digitalprocurement.dib.ae/images/logo.png"
st.set_page_config(page_title="DR Assistant", page_icon=logo_url)

st.image(logo_url, width=200)
st.title("Generative AI-Powered Disaster Recovery Assistant")
st.sidebar.title("DR Engineer Interface")
st.sidebar.subheader("Steps to Execute DR Procedures")

# Customizing Theme
st.markdown(
    """
    <style>
    body {
        background-color: #FFFFFF;
        color: #004080;
    }
    .sidebar .sidebar-content {
        background-color: #F0F8FF;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# Upload Section
st.sidebar.header("Upload Run Books")
uploaded_files = st.sidebar.file_uploader(
    "Upload Run Books (Word Documents)", type=["docx", "pdf", "txt"], accept_multiple_files=True
)

# Placeholder to store uploaded run book names
if "run_books" not in st.session_state:
    st.session_state["run_books"] = []

# Display Uploaded Run Books
if uploaded_files:
    st.session_state.uploaded_files = uploaded_files
    for file in uploaded_files:
        if file.name not in st.session_state["run_books"]:
            st.session_state["run_books"].append(file.name)


st.sidebar.write("**Uploaded Run Books:**")
st.sidebar.write(st.session_state["run_books"])

# Mock System and DR Engineer Selection
st.header("System and DR Configuration")

# Placeholder for systems (based on mock data extracted from run books)
systems = {
    "Payments (EPH)": ["Primary", "Secondary"],
    "Core Banking (Temenos)": ["Primary", "Secondary"],
    "Cards (Vision Plus+)": ["Primary", "Secondary"],
}

system_choices = {}
# Create a form to allow selection for each system
with st.form(key="dr_system_form"):
    st.write("Select Primary or Secondary for each System:")
    for system, options in systems.items():
        system_choices[system] = st.radio(system, options, index=0)

    submit_button = st.form_submit_button(label="Generate Drill Steps")


failover_list_str = ""

for system in system_choices:
    if system_choices[system] == "Secondary":
        failover_list_str += system

prompt = f"""
        You are an expert Senior Disaster Recovery (DR) Engineer creating a step-by-step DR drill plan.

        **SCENARIO:**
        Perform a failover of the following system(s) to the Secondary site: **{failover_list_str}**.
        All other systems remain on Primary.

        **YOUR TASK:**
        Based ONLY on the provided runbook text, create a comprehensive checklist for a DR Engineer. The plan must be clear, sequential, and include specific technical details (commands, hostnames, IPs, scripts, contacts) found in the documents. Structure your response in Markdown with these sections:
        1.  **Pre-Drill Communication & Checks:** Who to notify and what to verify first.
        2.  **Execution Plan:** A numbered list of exact commands and actions to failover {failover_list_str}.
        3.  **Validation Plan:** Specific checks to confirm the failover was successful, including validating connectivity to dependent systems using their Primary site details from the runbooks.
        4.  **Rollback Plan:** High-level steps to revert the changes.
        """
if submit_button:
    st.success("Configuration Submitted Successfully!")
    st.header("Generated DR Drill Steps")

    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    completion = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": extract_text(uploaded_files)}
        ],
        max_tokens=4096,
        temperature=0.6,
        frequency_penalty=0.0,
        presence_penalty=0.0,
    )
    response = completion.choices[0].message.content.strip()

    st.write(response)

    st.download_button(
        label=f"Download Steps",
        data=response,
        file_name=f"DR_Steps.txt",
        mime="text/plain",
    )

st.sidebar.markdown("---")
st.sidebar.write("Powered by Streamlit, OpenAI, and FAISS.")

