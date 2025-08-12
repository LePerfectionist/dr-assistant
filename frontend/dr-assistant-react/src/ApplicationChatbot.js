// src/components/ApplicationChatbot.js
import React, { useState, useEffect, useRef } from 'react';
import './ChatBubble.css';

const ApplicationChatbot = ({ token, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [applicationId, setApplicationId] = useState('');
  const [awaitingAppId, setAwaitingAppId] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! Please provide the Application ID you want to discuss.'
      }]);
      setAwaitingAppId(true);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Handle application ID submission
    if (awaitingAppId) {
      const newAppId = input.trim();
      setApplicationId(newAppId);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: newAppId },
        { 
          role: 'assistant', 
          content: `Thank you! I'm now ready to answer questions about Application ${newAppId}. What would you like to know?`
        }
      ]);
      setInput('');
      setAwaitingAppId(false);
      return;
    }

    // Handle normal chat messages
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/chat/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: input,
            conversation_id: conversationId,
            application_id: applicationId
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.answer || data.detail || 'Request failed');
      }

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: data.answer,
          sources: data.sources || []
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Error: ${error.message || 'Failed to get response'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetConversation = () => {
    setApplicationId('');
    setMessages([]);
    setConversationId(null);
    setAwaitingAppId(true);
  };

  return (
    <div className={`chatbot-container application-chat ${isOpen ? 'open' : ''}`}>
      <div className="chatbox">
        <div className="chat-header">
          <span>
            {applicationId ? `Application ${applicationId} Assistant` : 'Application Assistant'}
          </span>
          <div className="chat-header-controls">
            <button 
              className="chat-reset-btn"
              onClick={resetConversation}
              title="Start new conversation"
            >
              🔄
            </button>
            <button 
              className="chat-close-btn"
              onClick={() => {
                setIsOpen(false);
                onClose();
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'user' && awaitingAppId 
                  ? `Application ID: ${msg.content}` 
                  : msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <small>Sources: {msg.sources.join(', ')}</small>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              awaitingAppId 
                ? 'Enter Application ID...' 
                : `Ask about Application ${applicationId}...`
            }
            disabled={isLoading}
            aria-label="Type your message"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationChatbot;