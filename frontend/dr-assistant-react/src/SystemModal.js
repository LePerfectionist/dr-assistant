// // SystemModal.js
// import React from "react";
// import ReactMarkdown from "react-markdown";
// import "./SystemModal.css";

// function SystemModal({ system, onClose }) {
//   if (!system) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <button className="modal-close" onClick={onClose}>✖</button>
//         <h2>{system.name}</h2>

//         <div className="modal-section">
//           <h4>DR Data:</h4>
//           <div className="markdown-box">
//             <ReactMarkdown>{system.dr_data}</ReactMarkdown>
//           </div>
//         </div>

//         <div className="modal-section">
//           <h4>Dependencies:</h4>
//           <p>{system.dependencies?.join(", ")}</p>
//         </div>

//         {system.source_reference && (
//           <div className="modal-section">
//             <h4>Source:</h4>
//             <p>{system.source_reference}</p>
//           </div>
//         )}

//         {system.is_approved && (
//           <div className="modal-section approved-section">
//             ✅ Approved by <b>{system.approved_by}</b><br />
//             🕒 {new Date(system.approved_at).toLocaleString()} UTC
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default SystemModal;
// SystemModal.js
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./SystemModal.css";

function SystemModal({ system, user, token, onClose, refreshSystems }) {
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState({
    dr_data: system?.dr_data || "",
    dependencies: system?.dependencies?.join(", ") || "",
    source_reference: system?.source_reference || ""
  });

  const canEdit = user?.role === "admin" || user?.role === "checker";

  const handleChange = (e) => {
    setEdited({ ...edited, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const confirm = window.confirm("Save changes to this system?");
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/systems/${system.id}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          dr_data: edited.dr_data,
          dependencies: edited.dependencies.split(",").map((d) => d.trim()),
          source_reference: edited.source_reference
        })
      });

      if (res.ok) {
        alert("System updated successfully.");
        setEditMode(false);
        refreshSystems(); // re-fetch systems
      } else {
        alert("Failed to update system.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Error during update.");
    }
  };

  const handleReapprove = async () => {
    const confirm = window.confirm("Re-approve this system?");
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/systems/${system.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("System re-approved successfully.");
        refreshSystems();
      } else {
        alert("Re-approval failed.");
      }
    } catch (err) {
      console.error("Re-approve error:", err);
      alert("Error during re-approval.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✖</button>
        <h2>{system.name}</h2>

        {editMode ? (
          <>
            <label>DR Data:</label>
            <textarea
              name="dr_data"
              value={edited.dr_data}
              onChange={handleChange}
              rows={6}
              style={{ width: "100%" }}
            />
            <label>Dependencies (comma-separated):</label>
            <input
              name="dependencies"
              value={edited.dependencies}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
            <label>Source Reference:</label>
            <input
              name="source_reference"
              value={edited.source_reference}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
            <button onClick={handleSave}>💾 Save</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            <div className="modal-section">
              <h4>DR Data:</h4>
              <div className="markdown-box">
                <ReactMarkdown>{system.dr_data}</ReactMarkdown>
              </div>
            </div>

            <div className="modal-section">
              <h4>Dependencies:</h4>
              <p>{system.dependencies?.join(", ")}</p>
            </div>

            {system.source_reference && (
              <div className="modal-section">
                <h4>Source:</h4>
                <p>{system.source_reference}</p>
              </div>
            )}
          </>
        )}

        {system.is_approved && (
          <div className="modal-section approved-section">
            ✅ Approved by <b>{system.approved_by}</b><br />
            🕒 {new Date(system.approved_at).toLocaleString()} UTC
          </div>
        )}

        {/* Action buttons */}
        <div className="modal-actions">
          {canEdit && !editMode && (
            <button onClick={() => setEditMode(true)}>✏️ Edit</button>
          )}
          {canEdit && (
            <button onClick={handleReapprove}>🔁 Re-Approve</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemModal;
