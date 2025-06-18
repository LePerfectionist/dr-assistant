import streamlit as st
import requests

logo_url = "https://digitalprocurement.dib.ae/images/logo.png"
st.image(logo_url, width=200)
st.title("Generative AI-Powered Disaster Recovery Assistant")
st.markdown("---")
st.header("💬 Chat with Your Runbooks")

BACKEND_URL = "http://127.0.0.1:8000"

# --- Input Form ---
if "session_id" not in st.session_state:
    st.warning("Please upload runbooks and generate session first.")
    st.stop()

if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

user_input = st.text_input("Ask a question about your runbooks:")

if user_input:
    chat_payload = {
        "session_id": st.session_state["session_id"],
        "question": user_input,
        "include_dr_context": True
    }
    with st.spinner("Getting answer..."):
        try:
            res = requests.post(f"{BACKEND_URL}/chat", json=chat_payload)
            res.raise_for_status()
            answer = res.json()["answer"]
        except Exception as e:
            st.error(f"Error: {res.status_code} - {res.text}")
            answer = "Error: Unable to fetch answer from DR Assistant."

    st.session_state["chat_history"].append(("You", user_input))
    st.session_state["chat_history"].append(("Assistant", answer))

# --- Render Chat History ---
for sender, msg in st.session_state["chat_history"]:
    if sender == "You":
        st.markdown(f"**🧑‍💻 {sender}:** {msg}")
    else:
        st.markdown(f"**🤖 {sender}:** {msg}")
