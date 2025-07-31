import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import DependencyInput from './DependencyInput';
import "./SystemDetail.css";


function SystemDetail({ system, user, onApprove, onUpdate, allSystems }) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    dr_data: "",
    upstream_dependencies: [],
    downstream_dependencies: [],
    key_contacts: "",
    source_reference: "",
    system_type: "internal",
  });
  const [dependencySuggestions, setDependencySuggestions] = useState([]);
  const [alertSearchTerm, setAlertSearchTerm] = useState("");
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSourceBadge, setShowSourceBadge] = useState(false);

  useEffect(() => {
    if (system) {
      setEditedData({
        dr_data: system.dr_data || "",
        upstream_dependencies: system.upstream_dependencies?.map(d => ({ id: d, text: d })) || [],
        downstream_dependencies: system.downstream_dependencies?.map(d => ({ id: d, text: d })) || [],
        key_contacts: system.key_contacts?.join(", ") || "",
        source_reference: system.source_reference || "",
        system_type: system.system_type || "internal",
        approved_by: system.approved_by,
        approved_at: system.approved_at,
        is_approved: system.is_approved,
      });
      setShowSourceBadge(system.source === "manually_created");
    }
  }, [system]);

  useEffect(() => {
    if (allSystems) {
      setDependencySuggestions(
        allSystems.map(sys => ({ id: sys.name, text: sys.name })))
    }
  }, [allSystems]);

  const canEdit = user?.role === "admin" || user?.role === "checker";
  const canApprove = canEdit;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!editedData.dr_data.trim()) {
      alert("DR Data cannot be empty.");
      return;
    }

    const confirmEdit = window.confirm("Are you sure you want to save the changes?");
    if (!confirmEdit) return;

    setLoading(true);

    try {
      const url = user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/systems/${system.id}/update`
        : `http://localhost:8000/api/v1/validation/systems/${system.id}/update`;

      const payload = {
        dr_data: editedData.dr_data,
        system_type: editedData.system_type,
        source_reference: editedData.source_reference || null,
        upstream_dependencies: editedData.upstream_dependencies.map(tag => tag.text),
        downstream_dependencies: editedData.downstream_dependencies.map(tag => tag.text),
        key_contacts: editedData.key_contacts
          .split(",")
          .map(d => d.trim())
          .filter(Boolean),
        force_external: true
      };

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Update failed');
      }

      const updated = await res.json();
      alert("System updated successfully!");
      setEditMode(false);
      onUpdate && onUpdate(updated);
    } catch (err) {
      console.error("Update error:", err);
      alert(`Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = async () => {
    const confirm = window.confirm(
      system.is_approved
        ? "This system is already approved. Do you want to re-approve it?"
        : "Are you sure you want to approve this system?"
    );
    if (!confirm) return;

    setLoading(true);

    try {
      const url = user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/systems/${system.id}/approve`
        : `http://localhost:8000/api/v1/validation/systems/${system.id}/approve`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.ok) {
        alert("System approved!");
        onApprove && onApprove(system.id);
      } else {
        alert("Approval failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Approval error.");
    } finally {
      setLoading(false);
    }
  };

  if (!system) {
    return (
      <div className="system-detail empty-state">
        <div className="empty-content">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Please select a system to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`system-detail ${editMode ? 'edit-mode' : ''}`}>
      <div className="system-header">
        <h2 className="system-name">{system.name}</h2>
        <div className="system-meta">
          {showSourceBadge && (
            <span className={`source-badge ${system.source}`}>
              {system.source === "manually_created" ? "Manual" : "Auto"}
            </span>
          )}
          <span className={`type-badge ${system.system_type}`}>
            {system.system_type || "internal"}
          </span>
          {system.is_approved && (
            <span className="approval-badge">
              Approved
            </span>
          )}
        </div>
      </div>

      {editMode ? (
        <div className="edit-form">
          <div className="form-section">
            <label className="form-label">DR Data</label>
            <textarea
              name="dr_data"
              value={editedData.dr_data}
              onChange={handleChange}
              className="form-input"
              rows={8}
            />
          </div>

          <div className="form-grid">
            <div className="form-section">
              <label className="form-label">Upstream Dependencies</label>
              <DependencyInput
                tags={editedData.upstream_dependencies}
                setTags={(newTags) => setEditedData({...editedData, upstream_dependencies: newTags})}
                suggestions={dependencySuggestions}
              />
            </div>

            <div className="form-section">
              <label className="form-label">Downstream Dependencies</label>
              <DependencyInput
                tags={editedData.downstream_dependencies}
                setTags={(newTags) => setEditedData({...editedData, downstream_dependencies: newTags})}
                suggestions={dependencySuggestions}
              />
            </div>

            <div className="form-section">
              <label className="form-label">Key Contacts (comma separated)</label>
              <input
                type="text"
                name="key_contacts"
                value={editedData.key_contacts}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Source Reference</label>
              <input
                type="text"
                name="source_reference"
                value={editedData.source_reference}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setEditMode(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="data-section">
            <h3 className="section-title">DR Data</h3>
            <div className="markdown-content">
              <ReactMarkdown>{system.dr_data || "No DR data available"}</ReactMarkdown>
            </div>
          </div>

          <div className="data-grid">
            <div className="data-card">
              <h3 className="card-title">Upstream Dependencies</h3>
              <div className="dependency-list">
                {system.upstream_dependencies?.length ? (
                  system.upstream_dependencies.map((dep, index) => (
                    <span 
                      key={index} 
                      className={`dependency-tag ${
                        allSystems?.some(s => s.name === dep) ? 'internal' : 'external'
                      }`}
                    >
                      {dep}
                    </span>
                  ))
                ) : (
                  <p className="no-data">No upstream dependencies</p>
                )}
              </div>
            </div>

            <div className="data-card">
              <h3 className="card-title">Downstream Dependencies</h3>
              <div className="dependency-list">
                {system.downstream_dependencies?.length ? (
                  system.downstream_dependencies.map((dep, index) => (
                    <span 
                      key={index} 
                      className={`dependency-tag ${
                        allSystems?.some(s => s.name === dep) ? 'internal' : 'external'
                      }`}
                    >
                      {dep}
                    </span>
                  ))
                ) : (
                  <p className="no-data">No downstream dependencies</p>
                )}
              </div>
            </div>

            <div className="data-card">
              <h3 className="card-title">Key Contacts</h3>
              <div className="contact-list">
                {system.key_contacts?.length ? (
                  <ul>
                    {system.key_contacts.map((contact, index) => (
                      <li key={index}>
                        <a href={`mailto:${contact}`}>{contact}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No key contacts</p>
                )}
              </div>
            </div>

            <div className="data-card">
              <h3 className="card-title">System Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Source:</span>
                  <span>{system.source_reference || "Not specified"}</span>
                </div>
                {system.is_approved && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Approved by:</span>
                      <span>{system.approved_by}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Approved at:</span>
                      <span>{new Date(system.approved_at).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            {canEdit && (
              <button 
                className="btn btn-edit" 
                onClick={() => setEditMode(true)}
              >
                Edit System
              </button>
            )}
            {canApprove && (
              <button
                className={`btn btn-approve ${system.is_approved ? "approved" : ""}`}
                onClick={handleApproveClick}
                disabled={loading}
              >
                {loading ? 'Processing...' : system.is_approved ? "Re-Approve" : "Approve"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SystemDetail;