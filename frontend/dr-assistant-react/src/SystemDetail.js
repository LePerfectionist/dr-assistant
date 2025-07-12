
// // import React, { useEffect, useState } from "react";
// // import ReactMarkdown from "react-markdown";
// // import "./SystemDetail.css";

// // function SystemDetail({ system, user, onApprove, onUpdate }) {
// //   const [editMode, setEditMode] = useState(false);
// //   const [editedData, setEditedData] = useState({
// //     dr_data: "",
// //     dependencies: "",
// //     source_reference: ""
// //   });

// //   useEffect(() => {
// //     if (system) {
// //       setEditedData({
// //         dr_data: system.dr_data || "",
// //         dependencies: system.dependencies?.join(", ") || "",
// //         source_reference: system.source_reference || ""
// //       });
// //     }
// //   }, [system]);

// //   if (!system) return <div className="detail-panel">Select a system to view details.</div>;

// //   const canEdit = user?.role === "admin" || user?.role === "checker";
// //   const canApprove = user?.role === "admin" || user?.role === "checker";

// //   const handleChange = (e) => {
// //     setEditedData({ ...editedData, [e.target.name]: e.target.value });
// //   };

// //   const handleSave = async () => {
// //     if (!editedData.dr_data.trim()) {
// //       alert("DR Data cannot be empty.");
// //       return;
// //     }

// //     const confirmEdit = window.confirm("Are you sure you want to save the changes?");
// //     if (!confirmEdit) return;

// //     try {
// //       const res = await fetch(`http://localhost:8000/api/v1/systems/${system.id}/update`, {
// //         method: "PATCH",
// //         headers: {
// //           "Content-Type": "application/json",
// //           Authorization: `Bearer ${user.token}`,
// //         },
// //         body: JSON.stringify({
// //           dr_data: editedData.dr_data,
// //           dependencies: editedData.dependencies.split(",").map((d) => d.trim()),
// //           source_reference: editedData.source_reference,
// //         }),
// //       });

// //       if (res.ok) {
// //         const updated = await res.json();
// //         alert("System updated successfully!");
// //         setEditMode(false);
// //         onUpdate && onUpdate(updated);
// //       } else {
// //         alert("Failed to update system.");
// //       }
// //     } catch (err) {
// //       console.error(err);
// //       alert("Error occurred during update.");
// //     }
// //   };

// //   const handleApproveClick = () => {
// //     const confirmApprove = window.confirm(
// //       system.is_approved
// //         ? "This system is already approved. Do you want to re-approve it?"
// //         : "Are you sure you want to approve this system?"
// //     );
// //     if (confirmApprove) {
// //       onApprove(system.id);
// //     }
// //   };

// //   return (
// //     <div className={`detail-panel ${editMode ? "editing" : ""}`}>
// //       <h2>{system.name}</h2>

// //       {editMode ? (
// //         <>
// //           <label><b>DR Data:</b></label>
// //           <textarea
// //             name="dr_data"
// //             value={editedData.dr_data}
// //             onChange={handleChange}
// //             rows={6}
// //             style={{ width: "100%" }}
// //           />

// //           <label><b>Dependencies (comma-separated):</b></label>
// //           <input
// //             name="dependencies"
// //             value={editedData.dependencies}
// //             onChange={handleChange}
// //             style={{ width: "100%" }}
// //           />

// //           <label><b>Source Reference:</b></label>
// //           <input
// //             name="source_reference"
// //             value={editedData.source_reference}
// //             onChange={handleChange}
// //             style={{ width: "100%" }}
// //           />

// //           <div className="action-buttons">
// //             <button onClick={handleSave}>💾 Save</button>
// //             <button onClick={() => setEditMode(false)}>Cancel</button>
// //           </div>
// //         </>
// //       ) : (
// //         <>
// //           <ReactMarkdown>{system.dr_data}</ReactMarkdown>
// //           <p><b>Dependencies:</b> {system.dependencies?.join(", ")}</p>
// //           <p><b>Source:</b> {system.source_reference}</p>
// //         </>
// //       )}

// //       {canEdit && !editMode && (
// //         <button onClick={() => setEditMode(true)}>✏️ Edit</button>
// //       )}

// //       {canApprove && (
// //         <button onClick={handleApproveClick}>
// //           {system.is_approved ? "🔁 Re-Approve" : "✅ Approve"}
// //         </button>
// //       )}

// //       {system.is_approved && system.approved_by && (
// //         <div className="approved-badge">
// //           ✅ Approved by {system.approved_by}<br />
// //           🕒 {new Date(system.approved_at).toLocaleString()} UTC
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default SystemDetail;
// import React, { useState, useEffect } from "react";
// import ReactMarkdown from "react-markdown";
// import "./SystemDetail.css";

// function SystemDetail({ system, user, onApprove, onUpdate }) {
//   const [editMode, setEditMode] = useState(false);
//   const [editedData, setEditedData] = useState({
//     dr_data: "",
//     dependencies: "",
//     source_reference: ""
//   });

//   useEffect(() => {
//     if (system) {
//       setEditedData({
//         dr_data: system.dr_data || "",
//         dependencies: system.dependencies?.join(", ") || "",
//         source_reference: system.source_reference || ""
//       });
//     }
//   }, [system]);

//   if (!system) return <div className="detail-panel">Select a system to view details.</div>;

//   const canEdit = user?.role === "admin" || user?.role === "checker";
//   const canApprove = canEdit;
//   const canDelete = user?.role === "admin";

//   const handleChange = (e) => {
//     setEditedData({ ...editedData, [e.target.name]: e.target.value });
//   };

//   const handleSave = async () => {
//     const confirm = window.confirm("Are you sure you want to save the changes?");
//     if (!confirm) return;

//     try {
//       const res = await fetch(`http://localhost:8000/api/v1/systems/${system.id}/update`, {
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
//         alert("System updated successfully!");
//         setEditMode(false);
//         if (onUpdate) onUpdate(); // ✅ refresh after update
//       } else {
//         alert("Failed to update system.");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error occurred during update.");
//     }
//   };

//   const handleApproveClick = () => {
//     const confirmApprove = window.confirm(
//       system.is_approved
//         ? "This system is already approved. Do you want to re-approve it?"
//         : "Are you sure you want to approve this system?"
//     );
//     if (confirmApprove) {
//       onApprove(system.id);
//     }
//   };

//   const handleDelete = async () => {
//     const confirmDelete = window.confirm("Are you sure you want to delete this system?");
//     if (!confirmDelete) return;

//     try {
//       const res = await fetch(`http://localhost:8000/api/v1/systems/${system.id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       });

//       if (res.ok) {
//         alert("System deleted successfully!");
//         if (onUpdate) onUpdate(); // ✅ refresh after delete
//       } else {
//         alert("Failed to delete system.");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error deleting system.");
//     }
//   };

//   return (
//     <div className="detail-panel">
//       <h2>{system.name}</h2>

//       {editMode ? (
//         <>
//           <label><b>DR Data:</b></label>
//           <textarea
//             name="dr_data"
//             value={editedData.dr_data}
//             onChange={handleChange}
//             rows={6}
//             style={{ width: "100%" }}
//           />

//           <label><b>Dependencies (comma-separated):</b></label>
//           <input
//             name="dependencies"
//             value={editedData.dependencies}
//             onChange={handleChange}
//             style={{ width: "100%" }}
//           />

//           <label><b>Source Reference:</b></label>
//           <input
//             name="source_reference"
//             value={editedData.source_reference}
//             onChange={handleChange}
//             style={{ width: "100%" }}
//           />

//           <button onClick={handleSave}>💾 Save Changes</button>
//           <button onClick={() => setEditMode(false)}>Cancel</button>
//         </>
//       ) : (
//         <>
//           <ReactMarkdown>{system.dr_data}</ReactMarkdown>
//           <p><b>Dependencies:</b> {system.dependencies?.join(", ")}</p>
//           <p><b>Source:</b> {system.source_reference}</p>
//         </>
//       )}

//       {canEdit && !editMode && (
//         <button onClick={() => setEditMode(true)}>✏️ Edit</button>
//       )}

//       {canApprove && (
//         <button onClick={handleApproveClick}>
//           {system.is_approved ? "🔁 Re-Approve" : "✅ Approve"}
//         </button>
//       )}

//       {canDelete && (
//         <button onClick={handleDelete} className="delete-btn">🗑️ Delete</button>
//       )}

//       {system.is_approved && system.approved_by && (
//         <span className="approved-badge">
//           ✅ Approved by {system.approved_by}<br />
//           🕒 {system.approved_at ? new Date(system.approved_at).toLocaleString() + " UTC" : "N/A UTC"}
//         </span>
//       )}
//     </div>
//   );
// }

// export default SystemDetail;
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./SystemDetail.css";

function SystemDetail({ system, user, onApprove, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    dr_data: "",
    dependencies: "",
    source_reference: ""
  });

  useEffect(() => {
    if (system) {
      setEditedData({
        dr_data: system.dr_data || "",
        dependencies: system.dependencies?.join(", ") || "",
        source_reference: system.source_reference || ""
      });
    }
  }, [system]);

  if (!system) return <div className="detail-panel">Select a system to view details.</div>;

  const canEdit = user?.role === "admin" || user?.role === "checker";
  const canApprove = user?.role === "admin" || user?.role === "checker";

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

    try {
      const res = await fetch(`http://localhost:8000/api/v1/systems/${system.id}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          dr_data: editedData.dr_data,
          dependencies: editedData.dependencies.split(",").map((d) => d.trim()),
          source_reference: editedData.source_reference,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        alert("System updated successfully!");
        setEditMode(false);
        if (onUpdate) onUpdate(updated);
      } else {
        alert("Failed to update system.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during update.");
    }
  };

  const handleApproveClick = () => {
    const confirmApprove = window.confirm(
      system.is_approved
        ? "This system is already approved. Do you want to re-approve it?"
        : "Are you sure you want to approve this system?"
    );
    if (confirmApprove) {
      onApprove(system.id);
    }
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

          <label><b>Dependencies (comma-separated):</b></label>
          <input
            name="dependencies"
            value={editedData.dependencies}
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
          <p><b>Dependencies:</b> {system.dependencies?.join(", ")}</p>
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
