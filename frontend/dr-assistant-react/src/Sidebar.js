import React from "react";
import "./Sidebar.css";

function Sidebar({ systems, selectedId, onSelect, appName }) {
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        {appName && <h3 className="app-title">{appName}</h3>}
        <h4 className="systems-title">Extracted Systems</h4>
      </div>
      
      <div className="systems-list">
        {systems.length > 0 ? (
          <ul className="systems-ul">
            {systems.map((sys) => (
              <li
                key={sys.id}
                className={`system-item ${sys.id === selectedId ? 'active' : ''}`}
                onClick={() => onSelect(sys)}
              >
                <div className="system-content">
                  <span className="system-name">{sys.name}</span>
                  <span className={`status-badge ${sys.is_approved ? 'approved' : 'pending'}`}>
                    {sys.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Upload a runbook to extract systems</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;