import React, { useState, useEffect } from 'react';

const ChangeProposalReview = ({ token }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');

  const fetchPendingProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/v1/change-proposals/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (proposalId, action) => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:8000/api/v1/change-proposals/${proposalId}/decision`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          comment: comment || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process decision');
      }

      // Refresh the proposals list
      await fetchPendingProposals();
      setSelectedProposal(null);
      setComment('');
    } catch (error) {
      console.error('Error processing decision:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProposals();
  }, [token]);

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    return value || 'None';
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2em',
        color: '#6c757d'
      }}>
        Loading change proposals...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        background: 'white',
        padding: '20px 25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '1.6em' }}>Pending Change Proposals</h2>
        <button 
          onClick={fetchPendingProposals} 
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px 20px',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {proposals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ fontSize: '1.2em', color: '#6c757d', margin: 0 }}>
            {error ? 'Error loading requests' : 'No pending change proposals found.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
          gap: '20px'
        }}>
          {proposals.map((proposal) => (
            <div key={proposal.id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #ffc107',
              cursor: 'pointer'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.3em' }}>
                  {proposal.system_name}
                </h3>
                <span style={{
                  background: '#e9ecef',
                  color: '#495057',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '0.85em',
                  fontWeight: '500'
                }}>
                  ID: {proposal.id}
                </span>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '8px 0', color: '#495057', fontSize: '0.95em' }}>
                  <strong>Requested by:</strong> {proposal.requested_by_name}
                </p>
                <p style={{ margin: '8px 0', color: '#495057', fontSize: '0.95em' }}>
                  <strong>Created:</strong> {formatDateTime(proposal.created_at)}
                </p>
                <p style={{ margin: '8px 0', color: '#495057', fontSize: '0.95em' }}>
                  <strong>Reason:</strong> {proposal.reason}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.1em' }}>
                  Proposed Changes:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {proposal.comparisons.map((comparison, index) => (
                    <div key={index} style={{
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '15px',
                      borderLeft: '3px solid #28a745'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#495057',
                        fontSize: '0.9em',
                        marginBottom: '8px'
                      }}>
                        {comparison.field_name.replace('_', ' ').toUpperCase()}:
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <span style={{
                            fontSize: '0.8em',
                            fontWeight: '500',
                            color: '#6c757d',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            Original:
                          </span>
                          <span style={{
                            display: 'block',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            wordWrap: 'break-word',
                            background: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            color: '#856404'
                          }}>
                            {formatValue(comparison.original_value)}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#28a745' }}>
                          →
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <span style={{
                            fontSize: '0.8em',
                            fontWeight: '500',
                            color: '#6c757d',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            Proposed:
                          </span>
                          <span style={{
                            display: 'block',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            wordWrap: 'break-word',
                            background: '#d1ecf1',
                            border: '1px solid #bee5eb',
                            color: '#0c5460'
                          }}>
                            {formatValue(comparison.proposed_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  style={{
                    padding: '10px 25px',
                    background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Review & Decide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProposal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '25px 30px',
              borderBottom: '2px solid #f0f0f0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '15px 15px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.4em' }}>
                Review Changes for {selectedProposal.system_name}
              </h3>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '28px',
                  cursor: 'pointer',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedProposal(null)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <p style={{ margin: '10px 0', color: '#495057' }}>
                  <strong>Requested by:</strong> {selectedProposal.requested_by_name}
                </p>
                <p style={{ margin: '10px 0', color: '#495057' }}>
                  <strong>Reason:</strong> {selectedProposal.reason}
                </p>
                <p style={{ margin: '10px 0', color: '#495057' }}>
                  <strong>Created:</strong> {formatDateTime(selectedProposal.created_at)}
                </p>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#333', marginBottom: '20px', fontSize: '1.2em' }}>
                  Detailed Changes Review:
                </h4>
                {selectedProposal.comparisons.map((comparison, index) => (
                  <div key={index} style={{
                    background: '#ffffff',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{
                      margin: '0 0 15px 0',
                      color: '#495057',
                      fontSize: '1em',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {comparison.field_name.replace('_', ' ')}
                    </h5>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h6 style={{
                          margin: '0 0 10px 0',
                          fontSize: '0.9em',
                          fontWeight: '600',
                          color: '#6c757d'
                        }}>
                          Current Value:
                        </h6>
                        <div style={{
                          padding: '15px',
                          borderRadius: '8px',
                          minHeight: '60px',
                          fontFamily: 'monospace',
                          fontSize: '0.9em',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          background: '#fff3cd',
                          border: '2px solid #ffeaa7',
                          color: '#856404'
                        }}>
                          {formatValue(comparison.original_value)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h6 style={{
                          margin: '0 0 10px 0',
                          fontSize: '0.9em',
                          fontWeight: '600',
                          color: '#6c757d'
                        }}>
                          Proposed Value:
                        </h6>
                        <div style={{
                          padding: '15px',
                          borderRadius: '8px',
                          minHeight: '60px',
                          fontFamily: 'monospace',
                          fontSize: '0.9em',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          background: '#d1ecf1',
                          border: '2px solid #bee5eb',
                          color: '#0c5460'
                        }}>
                          {formatValue(comparison.proposed_value)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ margin: '25px 0' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#495057'
                }}>
                  Comment (optional):
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any comments about your decision..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end',
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid #e9ecef'
              }}>
                <button
                  onClick={() => handleDecision(selectedProposal.id, 'reject')}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 25px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '140px',
                    background: actionLoading ? '#6c757d' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white'
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Reject Changes'}
                </button>
                <button
                  onClick={() => handleDecision(selectedProposal.id, 'approve')}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 25px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '140px',
                    background: actionLoading ? '#6c757d' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white'
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Approve Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeProposalReview;