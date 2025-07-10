// SystemDetail.js
import React from "react";
import ReactMarkdown from "react-markdown";

function SystemDetail({ system, user, onApprove }) {
  if (!system) return <div className="detail-panel">Select a system to view details.</div>;

  return (
    <div className="detail-panel">
      <h2>{system.name}</h2>
      <ReactMarkdown>{system.dr_data}</ReactMarkdown>
      <p><b>Dependencies:</b> {system.dependencies.join(", ")}</p>
      <p><b>Source:</b> {system.source_reference}</p>
      {user?.role === "admin" && !system.is_approved && (
        <button onClick={() => onApprove(system.id)}>Approve</button>
      )}
      {system.is_approved && <span className="approved-badge">✅ Approved</span>}
    </div>
  );
}

export default SystemDetail;
