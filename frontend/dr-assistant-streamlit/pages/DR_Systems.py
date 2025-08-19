import streamlit as st
import requests
import json
from uuid import uuid4

# --- App Setup ---
st.set_page_config(page_title="DR Assistant", page_icon="🛡️")
logo_url = "https://digitalprocurement.dib.ae/images/logo.png"
st.image(logo_url, width=200)
st.title("Generative AI-Powered Disaster Recovery Assistant")
st.sidebar.header("Upload Run Books")

# --- Upload Files ---
uploaded_files = st.sidebar.file_uploader(
    "Upload Run Books (Word Documents)", type=["docx", "pdf", "txt"], accept_multiple_files=True
)
if uploaded_files:
    st.session_state.uploaded_files = uploaded_files

# --- FastAPI Backend URL ---
BACKEND_URL = "http://127.0.0.1:8001"

# --- Session State ---
if "session_id" not in st.session_state:
    st.session_state["session_id"] = str(uuid4())
if "uploaded" not in st.session_state:
    st.session_state["uploaded"] = False

if uploaded_files and not st.session_state.uploaded:
    files_to_upload = [("files", (f.name, f, f.type)) for f in uploaded_files]
    with st.spinner("Uploading and processing runbooks..."):
        res = requests.post(f"{BACKEND_URL}/extract_dr_systems", files=files_to_upload)
    if res.status_code == 200:
        st.success("Runbooks uploaded and embedded successfully!")
        st.session_state["session_id"] = res.json()["session_id"]
        st.session_state["uploaded"] = True
    else:
        st.error("Upload failed. Check server logs.")
        st.stop()


    systems_data = res.json()["extracted_data"]
    for system in systems_data:
        st.subheader(system)
        st.markdown(systems_data[system]["dr_data"])