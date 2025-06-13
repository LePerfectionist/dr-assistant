import streamlit as st

st.markdown("---")
st.header("\U0001F4AC Chat with Your Runbooks")

uploaded_files = st.session_state.get("uploaded_files", [])
from file_processing import get_chatbot_chain


if uploaded_files:
    chatbot = get_chatbot_chain(uploaded_files)

    if "chat_history" not in st.session_state:
        st.session_state["chat_history"] = []

    user_input = st.text_input("Ask a question about your runbooks:")

    # if user_input:
    #     result = chatbot.invoke({"question": user_input})
    #     # result = chatbot.run(user_input)
    #     st.session_state["chat_history"].append(("You", user_input))
    #     st.session_state["chat_history"].append(("Assistant", result))

    if user_input:
    # 1. Pass BOTH the question and the current chat history to the chain
        result = chatbot.invoke({
            "question": user_input,
            "chat_history": st.session_state["chat_history"]
        })

        # 2. Extract the text answer from the result dictionary
        answer = result['answer']

        # 3. Append the new question and the new answer to the history
        st.session_state["chat_history"].append(("You", user_input))
        st.session_state["chat_history"].append(("Assistant", answer))

    for sender, msg in st.session_state["chat_history"]:
        if sender == "You":
            st.markdown(f"**\U0001F9D1‍💻 {sender}:** {msg}")
        else:
            st.markdown(f"**\U0001F916 {sender}:** {msg}")