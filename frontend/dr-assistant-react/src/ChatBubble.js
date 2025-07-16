import React, { useState } from "react";
import "./ChatBubble.css";

function ChatBubble({ token, application }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    try {
      const res = await fetch(`http://localhost:8000/api/v1/chat/${application}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }), // ✅ FIXED to match backend
      });

      const data = await res.json();
      const assistantMessage = { role: "assistant", content: data.answer };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "❌ Failed to get a response." },
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>💬</button>
      )}
      {isOpen && (
        <div className="chatbox">
          <div className="chat-header">
            Chat Assistant
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBubble;
