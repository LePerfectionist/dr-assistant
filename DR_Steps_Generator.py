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

# --- FastAPI Backend URL ---
BACKEND_URL = "http://127.0.0.1:8000"  # replace with deployed endpoint if needed

# --- Session State ---
if "session_id" not in st.session_state:
    st.session_state["session_id"] = str(uuid4())
if "uploaded" not in st.session_state:
    st.session_state["uploaded"] = False

if uploaded_files and not st.session_state.uploaded:
    files_to_upload = [("files", (f.name, f, f.type)) for f in uploaded_files]
    with st.spinner("Uploading and embedding runbooks..."):
        res = requests.post(f"{BACKEND_URL}/upload_runbooks", files=files_to_upload)
    if res.status_code == 200:
        st.success("Runbooks uploaded and embedded successfully!")
        st.session_state["session_id"] = res.json()["session_id"]
        st.session_state["uploaded"] = True
    else:
        st.error("Upload failed. Check server logs.")
        st.stop()

# --- System Failover Configuration ---
st.sidebar.markdown("---")
st.sidebar.subheader("System Failover Selection")

systems = {
    "Payments (EPH)": ["Primary", "Secondary"],
    "Core Banking (Temenos)": ["Primary", "Secondary"],
    "Cards (Vision Plus+)": ["Primary", "Secondary"],
}

system_choices = {}
with st.form("failover_form"):
    st.write("Select Primary/Secondary:")
    for system, options in systems.items():
        system_choices[system] = st.radio(system, options, index=0)
    submitted = st.form_submit_button("Generate Drill Steps")

#Hold in session
if "dr_steps" in st.session_state:
    st.markdown(st.session_state.dr_steps, unsafe_allow_html=True)
    st.download_button("Download Steps", data=st.session_state.dr_steps, file_name="dr_steps.txt")

# --- Call FastAPI to Generate DR Steps ---
if submitted:
    payload = {
        "session_id": st.session_state["session_id"],
        "system_choices": system_choices,
    }
    with st.spinner("Generating DR Steps..."):
        res = requests.post(
            f"{BACKEND_URL}/generate-dr-steps",
            json=payload
        )
    if res.status_code == 200:
        response = res.json()["dr_steps"]
        st.session_state["dr_steps"] = response
        st.markdown("### Generated DR Drill Steps")
        st.markdown(response, unsafe_allow_html=True)
        st.download_button("Download Steps", data=response, file_name="dr_steps.txt")
        
    else:
        st.error("Failed to generate DR Steps.")
