
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import ReactMarkdown from "react-markdown";
import DependencyInput from './DependencyInput';
import "./MyApplications.css";
import apiClient from './apiClient';

function MyApplications( { setView }) {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [systemsMap, setSystemsMap] = useState({});
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [dependencySuggestions, setDependencySuggestions] = useState([]);

  const fetchApplications = async () => {
    const url =
      user.role === "admin"
        ? "http://localhost:8000/api/v1/admin/applications"
        : "http://localhost:8000/api/v1/validation/applications";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setApplications(data);
  };

  const fetchSystems = async (appId) => {
    const url =
      user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/applications/${appId}/systems`
        : `http://localhost:8000/api/v1/validation/applications/${appId}/systems`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSystemsMap((prev) => ({ ...prev, [appId]: data }));
  };

  const handleExpand = (appId) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
      setSelectedSystemId(null);
    } else {
      setExpandedAppId(appId);
      fetchSystems(appId);
      setSelectedSystemId(null);
    }
  };

  useEffect(() => {
    if (expandedAppId && systemsMap[expandedAppId]) {
      const allSystemNames = systemsMap[expandedAppId].map(sys => ({
        id: sys.name,
        text: sys.name
      }));
      setDependencySuggestions(allSystemNames);
    }
  }, [expandedAppId, systemsMap]);

  const handleSystemClick = (sys) => {
    setSelectedSystemId(sys.id);
    setEditedData({
      dr_data: sys.dr_data || "",
      // Convert arrays of strings to the { id, text } format for the tag component
      upstream_dependencies: sys.upstream_dependencies?.map(d => ({ id: d, text: d })) || [],
      downstream_dependencies: sys.downstream_dependencies?.map(d => ({ id: d, text: d })) || [],
      key_contacts: sys.key_contacts?.join(", ") || "", // Keep contacts as a simple string for now
      source_reference: sys.source_reference || "",
      approved_by: sys.approved_by,
      approved_at: sys.approved_at,
      is_approved: sys.is_approved,
    });
    setEditMode(false);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve or Re-Approve this system?")) return;

    const res = await fetch(
      `http://localhost:8000/api/v1/validation/systems/${id}/approve`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.ok) {
      alert("Approved");
      fetchSystems(expandedAppId);
    } else {
      alert("Approval failed");
    }
  };

  const handleSave = async () => {
    const body = JSON.stringify(
      {
        dr_data: editedData.dr_data,
        // Convert arrays of tags back to arrays of strings
        upstream_dependencies: editedData.upstream_dependencies.map(tag => tag.text),
        downstream_dependencies: editedData.downstream_dependencies.map(tag => tag.text),
        key_contacts: editedData.key_contacts.split(",").map((c) => c.trim()),
        source_reference: editedData.source_reference,
      }
    );
    const res = await fetch(
      `http://localhost:8000/api/v1/validation/systems/${selectedSystemId}/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body
      }
    );
    if (res.ok) {
      alert("Updated");
      fetchSystems(expandedAppId);
      setEditMode(false);
    } else {
      alert("Update failed");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="my-applications">
      <h2>📂 All Applications</h2>
      <div className="applications-layout">
        {/* Left Panel: Application List */}
        <div className="left-panel">
          {applications.map((app) => (
            <div key={app.id} className="application-block">
              <div className="app-header" onClick={() => handleExpand(app.id)}>
                <strong>App #{app.id}</strong> - {app.user_name} -{" "}
                {new Date(app.started_at).toLocaleDateString()} ▶
              </div>
            </div>
          ))}
        </div>

        {/* Middle Panel: Systems */}
        {expandedAppId && systemsMap[expandedAppId] && (
          <div className="middle-panel">
            <div className="panel-header">
              <h3>Systems</h3>
              <button
                className="view-graph-button"
                onClick={() => setView('analysis', expandedAppId)}
              >
                View Dependency Graph 📈
              </button>
            </div>
            {systemsMap[expandedAppId].map((sys) => (
              <div
                key={sys.id}
                className={`system-card ${
                  selectedSystemId === sys.id ? "selected" : ""
                }`}
                onClick={() => handleSystemClick(sys)}
              >
                <strong>{sys.name}</strong>
                <br />
                {sys.is_approved ? (
                  <span className="approved">
                    ✅ {sys.approved_by} -{" "}
                    {new Date(sys.approved_at).toLocaleString()} UTC
                  </span>
                ) : (
                  <span className="pending">❌ Pending</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Right Panel: System Details */}
        {selectedSystemId && (
          <div className="right-panel system-detail-panel">
            <h3>System Details</h3>
            {editMode ? (
              <>
                <label>DR Data</label>
                <textarea
                  rows="6"
                  value={editedData.dr_data}
                  onChange={(e) =>
                    setEditedData({ ...editedData, dr_data: e.target.value })
                  }
                />
                <label>Upstream Dependencies</label>
                <DependencyInput
                  tags={editedData.upstream_dependencies || []}
                  setTags={(newTags) => 
                    setEditedData({ ...editedData, upstream_dependencies: newTags })
                  }
                  suggestions={dependencySuggestions}
                />

                <label>Downstream Dependencies</label>
                <DependencyInput
                  tags={editedData.downstream_dependencies || []}
                  setTags={(newTags) => 
                    setEditedData({ ...editedData, downstream_dependencies: newTags })
                  }
                  suggestions={dependencySuggestions}
                />
                <label>Key Contacts (comma-separated)</label>
                <input
                  value={editedData.key_contacts}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      key_contacts: e.target.value,
                    })
                  }
                />
                <label>Source Reference</label>
                <input
                  value={editedData.source_reference}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      source_reference: e.target.value,
                    })
                  }
                />
                <button onClick={handleSave}>💾 Save</button>
                <button onClick={() => setEditMode(false)}>Cancel</button>
              </>
            ) : (
              <>
                <ReactMarkdown>{editedData.dr_data}</ReactMarkdown>
                <p><strong>Upstream:</strong></p>
                <div className="dependency-tags-display">
                  {editedData.upstream_dependencies?.map(tag => (
                    <span 
                      key={tag.id} 
                      // Add a conditional class: 'external' if the system name is not in our suggestions list
                      className={`tag-display ${!dependencySuggestions.some(s => s.id === tag.id) ? 'external' : ''}`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>

                <p><strong>Downstream:</strong></p>
                <div className="dependency-tags-display">
                   {editedData.downstream_dependencies?.map(tag => (
                    <span 
                      key={tag.id} 
                      className={`tag-display ${!dependencySuggestions.some(s => s.id === tag.id) ? 'external' : ''}`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>
                <p>
                  <strong>Key Contacts:</strong> {editedData.key_contacts}
                </p>
                <p>
                  <strong>Source:</strong> {editedData.source_reference}
                </p>

                {editedData.is_approved &&
                  editedData.approved_by &&
                  editedData.approved_at && (
                    <p className="approval-meta">
                      ✅ Approved by <strong>{editedData.approved_by}</strong>{" "}
                      on{" "}
                      <strong>
                        {new Date(editedData.approved_at).toLocaleString()} UTC
                      </strong>
                    </p>
                  )}

                <button onClick={() => setEditMode(true)}>✏️ Edit</button>
                <button onClick={() => handleApprove(selectedSystemId)}>
                  ✅ {editedData.is_approved ? "Re-Approve" : "Approve"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyApplications;