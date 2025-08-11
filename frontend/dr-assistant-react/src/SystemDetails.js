import React from 'react';
import './SystemDetails.css';

function SystemDetails({ system, onBack, onRequest }) {
  return (
    <div className="system-details">
      <button className="back-btn" onClick={onBack}>
        &larr; Back to list
      </button>
      
      <h2>{system.name} Details</h2>
      
      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{system.system_type}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Status:</span>
          <span className={`detail-value ${system.is_approved ? 'approved' : 'pending'}`}>
            {system.is_approved ? 'Approved' : 'Pending Approval'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">DR Data:</span>
          <span className="detail-value">{system.dr_data || 'Not available'}</span>
        </div>
        {/* Add more details as needed */}
      </div>

      {!system.is_approved && (
        <button className="request-btn" onClick={onRequest}>
          Request Approval
        </button>
      )}
    </div>
  );
}

export default SystemDetails;