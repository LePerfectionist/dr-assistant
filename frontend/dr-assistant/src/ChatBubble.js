import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatBubble.css";

const ChatBubble = ({ sessionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatBodyRef = useRef(null);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setChatHistory((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput(""); // Clear input immediately

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        session_id: sessionId,
        question: messageToSend,
        include_dr_context: true,
      });

      const assistantMessage = {
        role: "assistant",
        content: res.data.answer,
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err.response?.data || err.message);
      alert("Error sending message.");
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbox">
          <div className="chat-header">Ask your Query</div>
          <div className="chat-body" ref={chatBodyRef}>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <strong>
                  {msg.role === "user" ? "🧑 You: " : "🤖 Assistant: "}
                </strong>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input-area">
            <textarea
              rows={1}
              value={input}
              placeholder="Ask something..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
      <button className="chat-toggle" onClick={toggleChat}>
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
};

export default ChatBubble;
