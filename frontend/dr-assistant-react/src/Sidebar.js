// // import React, { useState } from "react";

// // function Sidebar({ systems, onSelect, selectedId }) {
// //   const [search, setSearch] = useState("");

// //   const filtered = systems?.filter(system =>
// //     system.name.toLowerCase().includes(search.toLowerCase())
// //   );

// //   if (!systems?.length) return <div className="sidebar">No systems extracted.</div>;

// //   return (
// //     <div className="sidebar">
// //       <h3>Extracted Systems</h3>
// //       <input
// //         className="search-input"
// //         type="text"
// //         placeholder="Search systems..."
// //         value={search}
// //         onChange={(e) => setSearch(e.target.value)}
// //       />
// //       {filtered.map((system) => (
// //         <div
// //           key={system.id}
// //           className={`system-title ${selectedId === system.id ? "selected" : ""}`}
// //           onClick={() => onSelect(system)}
// //         >
// //           {system.name} {system.is_approved && <span className="approved-check">✔️</span>}
// //         </div>
// //       ))}
// //     </div>
// //   );
// // }

// // export default Sidebar;
// import React, { useState, useEffect } from "react";
// import ReactMarkdown from "react-markdown";

// function SystemDetail({ system, user, onApprove }) {
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
//   const canApprove = user?.role === "admin" || user?.role === "checker";

//   const handleChange = (e) => {
//     setEditedData({ ...editedData, [e.target.name]: e.target.value });
//   };

//   const handleSave = async () => {
//     const confirmEdit = window.confirm("Are you sure you want to save the changes?");
//     if (!confirmEdit) return;

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
//         window.location.reload(); // refresh to get updated values
//       } else {
//         alert("Failed to update system.");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error occurred during update.");
//     }
//   };

//   const handleApproveClick = () => {
//     const confirmApprove = window.confirm("Are you sure you want to approve or re-approve this system?");
//     if (confirmApprove) {
//       onApprove(system.id);
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
//           <p><b>Dependencies:</b> {system.dependencies.join(", ")}</p>
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
// Sidebar.js
import React from "react";
import "./Sidebar.css";

function Sidebar({ systems, selectedId, onSelect }) {
  return (
    <div className="sidebar">
      <h3>Extracted Systems</h3>
      <ul>
        {systems.map((sys) => (
          <li
            key={sys.id}
            className={sys.id === selectedId ? "active" : ""}
            onClick={() => onSelect(sys)}
          >
            {sys.name}
            {sys.is_approved && <span className="tick">✔️</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
