
// // SystemDetail.js
// import React, { useState, useEffect } from "react";
// import ReactMarkdown from "react-markdown";
// import "./SystemDetail.css";

// function SystemDetail({ system, user, onApprove, onUpdate }) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedData, setEditedData] = useState({
//     dr_data: "",
//     dependencies: "",
//     source_reference: "",
//   });

//   useEffect(() => {
//     if (system) {
//       setEditedData({
//         dr_data: system.dr_data || "",
//         dependencies: system.dependencies?.join(", ") || "",
//         source_reference: system.source_reference || "",
//       });
//     }
//   }, [system]);

//   if (!system) return <div className="detail-panel">Select a system to view details.</div>;

//   const canEdit = user?.role === "admin" || user?.role === "checker";
//   const canApprove = canEdit;

//   const handleChange = (e) => {
//     setEditedData({ ...editedData, [e.target.name]: e.target.value });
//   };

//   const handleSave = async () => {
//     if (!editedData.dr_data.trim()) {
//       alert("DR Data cannot be empty.");
//       return;
//     }

//     const confirmEdit = window.confirm("Are you sure you want to save the changes?");
//     if (!confirmEdit) return;

//     const url =
//       user.role === "admin"
//         ? `http://localhost:8000/api/v1/admin/systems/${system.id}/update`
//         : `http://localhost:8000/api/v1/validation/systems/${system.id}/update`;

//     try {
//       const res = await fetch(url, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${user.token}`,
//         },
//         body: JSON.stringify({
//           dr_data: editedData.dr_data,
//           dependencies: editedData.dependencies.split(",").map((d) => d.trim()),
//           source_reference: editedData.source_reference,
//         }),
//       });

//       if (res.ok) {
//         const updated = await res.json();
//         alert("System updated successfully!");
//         setEditMode(false);
//         onUpdate && onUpdate(updated);
//       } else {
//         alert("Failed to update system.");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error occurred during update.");
//     }
//   };

//   const handleApproveClick = async () => {
//     const confirm = window.confirm(
//       system.is_approved
//         ? "This system is already approved. Do you want to re-approve it?"
//         : "Are you sure you want to approve this system?"
//     );
//     if (!confirm) return;

//     // ✅ Fix: pass only system.id to onApprove
//     onApprove(system.id);
//   };

//   return (
//     <div className={`detail-panel ${editMode ? "edit-mode" : ""}`}>
//       <h2>{system.name}</h2>

//       {editMode ? (
//         <>
//           <label><b>DR Data:</b></label>
//           <textarea
//             name="dr_data"
//             value={editedData.dr_data}
//             onChange={handleChange}
//             rows={6}
//           />

//           <label><b>Dependencies (comma-separated):</b></label>
//           <input
//             name="dependencies"
//             value={editedData.dependencies}
//             onChange={handleChange}
//           />

//           <label><b>Source Reference:</b></label>
//           <input
//             name="source_reference"
//             value={editedData.source_reference}
//             onChange={handleChange}
//           />

//           <div className="button-group">
//             <button onClick={handleSave}>💾 Save</button>
//             <button onClick={() => setEditMode(false)}>Cancel</button>
//           </div>
//         </>
//       ) : (
//         <>
//           <ReactMarkdown>{system.dr_data}</ReactMarkdown>
//           <p><b>Dependencies:</b> {system.dependencies?.join(", ")}</p>
//           <p><b>Source:</b> {system.source_reference}</p>
//         </>
//       )}

//       {!editMode && canEdit && (
//         <button onClick={() => setEditMode(true)}>✏️ Edit</button>
//       )}

//       {canApprove && (
//         <button onClick={handleApproveClick}>
//           {system.is_approved ? "🔁 Re-Approve" : "✅ Approve"}
//         </button>
//       )}

//       {system.is_approved && system.approved_by && (
//         <span className="approved-badge">
//           ✅ Approved by {system.approved_by}<br />
//           🕒 {new Date(system.approved_at).toLocaleString()} UTC
//         </span>
//       )}
//     </div>
//   );
// }

// export default SystemDetail;
// SystemDetail.js
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./SystemDetail.css";

function SystemDetail({ system, user, onApprove, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    dr_data: "",
    upstream_dependencies: "",
    downstream_dependencies: "",
    key_contacts: "",
    source_reference: "",
  });

  useEffect(() => {
    if (system) {
      setEditedData({
        dr_data: system.dr_data || "",
        upstream_dependencies: system.upstream_dependencies?.join(", ") || "",
        downstream_dependencies: system.downstream_dependencies?.join(", ") || "",
        key_contacts: system.key_contacts?.join(", ") || "",
        source_reference: system.source_reference || "",
      });
    }
  }, [system]);

  if (!system) return <div className="detail-panel">Select a system to view details.</div>;

  const canEdit = user?.role === "admin" || user?.role === "checker";
  const canApprove = canEdit;

  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!editedData.dr_data.trim()) {
      alert("DR Data cannot be empty.");
      return;
    }

    const confirmEdit = window.confirm("Are you sure you want to save the changes?");
    if (!confirmEdit) return;

    const url =
      user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/systems/${system.id}/update`
        : `http://localhost:8000/api/v1/validation/systems/${system.id}/update`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          dr_data: editedData.dr_data,
          upstream_dependencies: editedData.upstream_dependencies.split(",").map((d) => d.trim()),
          downstream_dependencies: editedData.downstream_dependencies.split(",").map((d) => d.trim()),
          key_contacts: editedData.key_contacts.split(",").map((d) => d.trim()),
          source_reference: editedData.source_reference,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        alert("System updated successfully!");
        setEditMode(false);
        onUpdate && onUpdate(updated);
      } else {
        alert("Failed to update system.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during update.");
    }
  };

  const handleApproveClick = async () => {
    const confirm = window.confirm(
      system.is_approved
        ? "This system is already approved. Do you want to re-approve it?"
        : "Are you sure you want to approve this system?"
    );
    if (!confirm) return;

    onApprove(system.id); // ✅ Pass just the ID
  };

  return (
    <div className={`detail-panel ${editMode ? "edit-mode" : ""}`}>
      <h2>{system.name}</h2>

      {editMode ? (
        <>
          <label><b>DR Data:</b></label>
          <textarea
            name="dr_data"
            value={editedData.dr_data}
            onChange={handleChange}
            rows={6}
          />

          <label><b>Upstream Dependencies (comma-separated):</b></label>
          <input
            name="upstream_dependencies"
            value={editedData.upstream_dependencies}
            onChange={handleChange}
          />

          <label><b>Downstream Dependencies (comma-separated):</b></label>
          <input
            name="downstream_dependencies"
            value={editedData.downstream_dependencies}
            onChange={handleChange}
          />

          <label><b>Key Contacts (comma-separated):</b></label>
          <input
            name="key_contacts"
            value={editedData.key_contacts}
            onChange={handleChange}
          />

          <label><b>Source Reference:</b></label>
          <input
            name="source_reference"
            value={editedData.source_reference}
            onChange={handleChange}
          />

          <div className="button-group">
            <button onClick={handleSave}>💾 Save</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <ReactMarkdown>{system.dr_data}</ReactMarkdown>
          <p><b>Upstream Dependencies:</b> {system.upstream_dependencies?.join(", ")}</p>
          <p><b>Downstream Dependencies:</b> {system.downstream_dependencies?.join(", ")}</p>
          <p><b>Key Contacts:</b> {system.key_contacts?.join(", ")}</p>
          <p><b>Source:</b> {system.source_reference}</p>
        </>
      )}

      {!editMode && canEdit && (
        <button onClick={() => setEditMode(true)}>✏️ Edit</button>
      )}

      {canApprove && (
        <button onClick={handleApproveClick}>
          {system.is_approved ? "🔁 Re-Approve" : "✅ Approve"}
        </button>
      )}

      {system.is_approved && system.approved_by && (
        <span className="approved-badge">
          ✅ Approved by {system.approved_by}<br />
          🕒 {new Date(system.approved_at).toLocaleString()} UTC
        </span>
      )}
    </div>
  );
}

export default SystemDetail;
