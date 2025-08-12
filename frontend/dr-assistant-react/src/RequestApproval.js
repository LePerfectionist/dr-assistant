import React, { useState } from 'react';
import './RequestApproval.css';

function RequestApproval({ system, user, isApproved, onRequestSubmit }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setMessage('Please enter a reason for your request');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          system_id: system.id,
          reason: reason,
          request_type: isApproved ? 'change' : 'approval'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Request submission failed');
      }

      setMessage('Request submitted successfully!');
      setTimeout(() => {
        onRequestSubmit();
      }, 1500);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-approval-container">
      <h3>Request {isApproved ? 'Changes' : 'Approval'} for {system.name}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Reason for your request:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
        {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
      </form>
    </div>
  );
}

export default RequestApproval;