import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import './RequestManagement.css';

function RequestManagement() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Set the number of items per page
  const requestsPerPage = 2; 

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const url = new URL(`http://localhost:8000/api/v1/requests/pending`);
      url.searchParams.append('page', currentPage);
      url.searchParams.append('per_page', requestsPerPage);
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.items || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Request Error:', error);
      setError(error.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedRequest || !decision) {
        throw new Error('No request or decision selected');
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/requests/${selectedRequest.id}/${decision}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ comment: comment || undefined }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process request');
      }

      // Refresh the list after successful action
      await fetchRequests();
      setSelectedRequest(null);
      setDecision('');
      setComment('');
    } catch (error) {
      console.error('Action Error:', error);
      setError(error.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token, currentPage, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim());
    setCurrentPage(1);
  };

  if (loading && requests.length === 0) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="request-management">
      <h2>Pending Approval Requests</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="requests-list">
        {requests.length === 0 ? (
          <div className="no-requests">
            {error ? 'Error loading requests' : 'No pending requests found'}
          </div>
        ) : (
          requests.map((request) => (
            <div 
              key={request.id} 
              className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
              onClick={() => setSelectedRequest(request)}
            >
              <h3>{request.system?.name || 'Unnamed System'}</h3>
              <p><strong>Requested by:</strong> {request.requested_by_user?.name || 'Unknown'}</p>
              <p><strong>Date:</strong> {new Date(request.created_at).toLocaleString()}</p>
              <p><strong>Reason:</strong> {request.reason || 'No reason provided'}</p>
              <p><strong>Status:</strong> {request.status || 'pending'}</p>
              
              {selectedRequest?.id === request.id && (
                <div className="request-actions">
                  <button
                    className="approve-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDecision('approve');
                      handleApproveReject();
                    }}
                    disabled={loading}
                  >
                    {loading && decision === 'approve' ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDecision('reject');
                      handleApproveReject();
                    }}
                    disabled={loading}
                  >
                    {loading && decision === 'reject' ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {requests.length > 0 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1 || loading} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages || loading} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default RequestManagement;