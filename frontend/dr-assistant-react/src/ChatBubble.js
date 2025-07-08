// ChatBubble.js
import React, { useState, useRef, useEffect } from "react";
import axios from "axios"; // For making HTTP POST requests
import "./ChatBubble.css"; // CSS file for styling the chat UI

// Reusable floating chatbot component
const ChatBubble = ({ sessionId }) => {
  // ------------------- State & Refs -------------------
  const [isOpen, setIsOpen] = useState(false);      // Whether chatbox is open or hidden
  const [input, setInput] = useState("");           // Current text typed by the user
  const [chatHistory, setChatHistory] = useState([]); // Array of past chat messages
  const chatBodyRef = useRef(null);                 // Ref to auto-scroll chat body

  // ------------------- Toggle Chat Window -------------------
  const toggleChat = () => setIsOpen((prev) => !prev);

  // ------------------- Send Message -------------------
  const handleSend = async () => {
    // Prevent empty message
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };

    // Append user message to history
    setChatHistory((prev) => [...prev, userMessage]);

    const messageToSend = input;
    setInput(""); // Clear input field immediately

    try {
      // Send user's message to FastAPI backend
      const res = await axios.post("http://localhost:8000/chat", {
        session_id: sessionId,
        question: messageToSend,
        include_dr_context: true,
      });

      // Append assistant response to history
      const assistantMessage = {
        role: "assistant",
        content: res.data.answer,
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err.response?.data || err.message);

      // Fallback message if backend fails
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I couldn't get a response. Please try again.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  };

  // ------------------- Auto Scroll Chat Body -------------------
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // ------------------- JSX Render -------------------
  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbox">
          {/* Chat header with title and close button */}
          <div className="chat-header">
            <span>Ask your Query</span>
            <button className="chat-close-btn" onClick={toggleChat}>
              ✕
            </button>
          </div>

          {/* Chat history area */}
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

          {/* Message input and send button */}
          <div className="chat-input-area">
            <textarea
              rows={1}
              value={input}
              placeholder="Ask something..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Send message on Enter (but allow Shift+Enter for new line)
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

      {/* Floating button to open chatbox */}
      {!isOpen && (
        <button className="chat-toggle" onClick={toggleChat}>
          💬
        </button>
      )}
    </div>
  );
};

export default ChatBubble;