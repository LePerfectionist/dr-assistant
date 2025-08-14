// src/components/ChatBubble.js
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatBubble.css';

const ChatBubble = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
        setMessages([{ 
            role: 'assistant', 
            content: 'Please provide system context for DR Steps generation.' 
        }]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
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
            conversation_id: conversationId 
          }),
        }
      );
      
      const data = await response.json();

      if (!response.ok) throw new Error(data.answer || data.detail || 'Request failed');
      if (!conversationId && data.conversation_id) setConversationId(data.conversation_id);
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Failed to get response'}` }]);
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

  const startNewConversation = () => {
      setConversationId(null);
      setMessages([{ 
        role: 'assistant', 
        content: 'Please provide system context for DR Steps generation.' 
      }]);
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {!isOpen ? (
        <button className="chat-toggle" onClick={() => setIsOpen(true)} aria-label="Open chat">💬</button>
      ) : (
        <div className="chatbox">
          <div className="chat-header">
            <span>DR Assistant</span>
            <div className="chat-header-controls">
                <button className="chat-reset-btn" onClick={startNewConversation} title="Start New Conversation">🔄</button>
                <button className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
            </div>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.sources && (
                  <div className="message-sources">
                    <small>Sources: {msg.sources.join(', ')}</small>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="typing-indicator"><span></span><span></span><span></span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your documents or systems..."
              disabled={isLoading}
              aria-label="Type your message"
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} aria-label="Send message">
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;