import React, { useState } from 'react';
import apiClient from './apiClient'; // Our authenticated API client
import ChatBubble from './ChatBubble'; // Your existing component
import './GraphChat.css'; // New styles for the chat interface

function GraphChat({ applicationId }) {
  const [messages, setMessages] = useState([
    // Initial message to guide the user
    {
      text: "I can answer questions about the system dependencies shown in the graph. Try asking: 'What systems depend on the Database?' or 'What will be impacted if the Firewall fails?'",
      sender: 'bot'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = { text: userInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post(
        `/api/v1/chat/${applicationId}/graph-query`,
        { query: userInput } // The request body for your endpoint
      );
      
      const botMessage = { text: response.data.answer, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      console.error("Error querying graph chat:", err);
      const errorMessage = { text: "Sorry, I encountered an error. Please try again.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="graph-chat-container">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg.text} sender={msg.sender} />
        ))}
        {isLoading && (
          <ChatBubble message="..." sender="bot" isLoading={true} />
        )}
      </div>
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask about system dependencies..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default GraphChat;