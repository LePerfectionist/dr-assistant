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
  const [showSourceBadge, setShowSourceBadge] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (system) {
      setEditedData({
        dr_data: system.dr_data || "",
        upstream_dependencies: system.upstream_dependencies?.map(d => ({ id: d, text: d })) || [],
        downstream_dependencies: system.downstream_dependencies?.map(d => ({ id: d, text: d })) || [],
        key_contacts: system.key_contacts?.join(", ") || "",
        source_reference: system.source_reference || "",
        system_type: system.system_type || "internal",
      });
      
      setShowSourceBadge(system.source === "manually_created");
      
      // Set dependency suggestions from all systems
      if (allSystems) {
        setDependencySuggestions(
          allSystems.map(sys => ({ id: sys.name, text: sys.name }))
        );
      }
    }
  }, [system, allSystems]);

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
    };

    // First try without force_external
    let res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payload),
    });

    // If we get an error about external dependencies, handle it
    if (!res.ok) {
      const errorData = await res.json();
      if (errorData.detail && errorData.detail.includes('Set force_external=true')) {
        // Get all system names in the application
        const currentSystemNames = allSystems?.map(sys => sys.name) || [];
        
        // Get current dependencies from the system being edited
        const currentUpstream = system.upstream_dependencies || [];
        const currentDownstream = system.downstream_dependencies || [];
        
        // Find only NEWLY added external dependencies
        const newExternalUpstream = editedData.upstream_dependencies
          .filter(tag => 
            !currentSystemNames.includes(tag.text) && // Is external
            !currentUpstream.includes(tag.text)       // Is newly added
          )
          .map(tag => tag.text);
        
        const newExternalDownstream = editedData.downstream_dependencies
          .filter(tag => 
            !currentSystemNames.includes(tag.text) && // Is external
            !currentDownstream.includes(tag.text)     // Is newly added
          )
          .map(tag => tag.text);

        // Find existing external dependencies that are being kept
        const existingExternalUpstream = editedData.upstream_dependencies
          .filter(tag => 
            !currentSystemNames.includes(tag.text) && // Is external
            currentUpstream.includes(tag.text)       // Already existed
          )
          .map(tag => tag.text);
        
        const existingExternalDownstream = editedData.downstream_dependencies
          .filter(tag => 
            !currentSystemNames.includes(tag.text) && // Is external
            currentDownstream.includes(tag.text)      // Already existed
          )
          .map(tag => tag.text);

        if (newExternalUpstream.length > 0 || newExternalDownstream.length > 0) {
          let confirmationMessage = "You're adding NEW external dependencies:\n\n";
          
          if (newExternalUpstream.length > 0) {
            confirmationMessage += `New Upstream:\n${newExternalUpstream.join('\n')}\n\n`;
          }
          
          if (newExternalDownstream.length > 0) {
            confirmationMessage += `New Downstream:\n${newExternalDownstream.join('\n')}\n\n`;
          }

          // Only show existing if there are any
          if (existingExternalUpstream.length > 0 || existingExternalDownstream.length > 0) {
            confirmationMessage += "The following existing external dependencies will be kept:\n";
            
            if (existingExternalUpstream.length > 0) {
              confirmationMessage += `Upstream:\n${existingExternalUpstream.join('\n')}\n\n`;
            }
            
            if (existingExternalDownstream.length > 0) {
              confirmationMessage += `Downstream:\n${existingExternalDownstream.join('\n')}\n\n`;
            }
          }
          
          confirmationMessage += "Do you want to proceed with these changes?";

          const confirmExternal = window.confirm(confirmationMessage);
          
          if (confirmExternal) {
            // Try again with force_external=true
            const urlWithForce = `${url}?force_external=true`;
            res = await fetch(urlWithForce, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
              body: JSON.stringify(payload),
            });
          } else {
            return; // User canceled
          }
        }
      }
    }

    if (res.ok) {
      const updated = await res.json();
      alert("System updated successfully!");
      setEditMode(false);
      onUpdate && onUpdate(updated);
    } else {
      const errorData = await res.json();
      alert(`Update failed: ${errorData.detail || 'Unknown error'}`);
    }
  } catch (err) {
    console.error("Update error:", err);
    alert("Error occurred during update.");
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
      <div className="detail-panel no-system-selected">
        <p>Please select a system to view details</p>
      </div>
    );
  }

  return (
    <div className={`detail-panel ${editMode ? "edit-mode" : ""}`}>
      <div className="system-header">
        <h3>{system.name}</h3>
        {showSourceBadge && (
          <span className="system-source-badge">
            {system.source === "manually_created" ? "Manually Created" : "Auto-Extracted"}
          </span>
        )}
      </div>
      {/* <p><b>Application ID:</b> #{system.application_id}</p> */}
      {system.uploaded_by && <p><b>Uploaded By:</b> {system.uploaded_by}</p>}

      {editMode ? (
        <>
          <div className="form-group">
            <label><b>DR Data:</b></label>
            <textarea
              name="dr_data"
              value={editedData.dr_data}
              onChange={handleChange}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label><b>Upstream Dependencies:</b></label>
            <DependencyInput
              tags={editedData.upstream_dependencies}
              setTags={(newTags) => setEditedData({...editedData, upstream_dependencies: newTags})}
              suggestions={dependencySuggestions}
            />
          </div>

          <div className="form-group">
            <label><b>Downstream Dependencies:</b></label>
            <DependencyInput
              tags={editedData.downstream_dependencies}
              setTags={(newTags) => setEditedData({...editedData, downstream_dependencies: newTags})}
              suggestions={dependencySuggestions}
            />
          </div>

          <div className="form-group">
            <label><b>Key Contacts (comma-separated):</b></label>
            <input
              type="text"
              name="key_contacts"
              value={editedData.key_contacts}
              onChange={handleChange}
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div className="form-group">
            <label><b>Source Reference:</b></label>
            <input
              type="text"
              name="source_reference"
              value={editedData.source_reference}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label><b>System Type:</b></label>
            <select
              name="system_type"
              value={editedData.system_type}
              onChange={handleChange}
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="unclassified">Unclassified</option>
            </select>
          </div>

          <div className="button-group">
            <button 
              className="btn-save" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : '💾 Save'}
            </button>
            <button 
              className="btn-cancel" 
              onClick={() => setEditMode(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="data-section">
            <h4>DR Data</h4>
            <div className="data-content">
              <ReactMarkdown>{system.dr_data || "No DR data available"}</ReactMarkdown>
            </div>
          </div>

          <div className="data-grid">
            <div className="data-item">
              <h4>Upstream Dependencies</h4>
              <div className="dependency-tags-display">
                {system.upstream_dependencies?.length ? (
                  system.upstream_dependencies.map((dep, index) => (
                    <span 
                      key={index} 
                      className={`tag-display ${
                        allSystems?.some(s => s.name === dep) ? '' : 'external'
                      }`}
                    >
                      {dep}
                    </span>
                  ))
                ) : (
                  <p>No upstream dependencies</p>
                )}
              </div>
            </div>

            <div className="data-item">
              <h4>Downstream Dependencies</h4>
              <div className="dependency-tags-display">
                {system.downstream_dependencies?.length ? (
                  system.downstream_dependencies.map((dep, index) => (
                    <span 
                      key={index} 
                      className={`tag-display ${
                        allSystems?.some(s => s.name === dep) ? '' : 'external'
                      }`}
                    >
                      {dep}
                    </span>
                  ))
                ) : (
                  <p>No downstream dependencies</p>
                )}
              </div>
            </div>

            <div className="data-item">
              <h4>Key Contacts</h4>
              <div className="data-content">
                {system.key_contacts?.length ? (
                  <ul>
                    {system.key_contacts.map((contact, index) => (
                      <li key={index}>{contact}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No key contacts</p>
                )}
              </div>
            </div>

            <div className="data-item">
              <h4>System Metadata</h4>
              <div className="data-content">
                <p><b>Type:</b> 
                  <span className={`system-type-badge ${system.system_type || 'internal'}`}>
                    {system.system_type || "internal"}
                  </span>
                </p>
                <p><b>Source:</b> {system.source_reference || "Not specified"}</p>
                {system.is_approved && (
                  <p className="approval-info">
                    <b>Approved by:</b> {system.approved_by}<br />
                    <b>Approved at:</b> {new Date(system.approved_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            {canEdit && (
              <button 
                className="btn-edit" 
                onClick={() => setEditMode(true)}
                disabled={loading}
              >
                ✏️ Edit
              </button>
            )}
            {canApprove && (
              <button
                className={`btn-approve ${system.is_approved ? "approved" : ""}`}
                onClick={handleApproveClick}
                disabled={loading}
              >
                {loading ? 'Processing...' : system.is_approved ? "🔁 Re-Approve" : "✅ Approve"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SystemDetail;