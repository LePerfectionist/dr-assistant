// // import React from "react";
// // import ReactMarkdown from "react-markdown";
// // import { useAuth } from "./AuthContext";

// // function Sidebar({ systems, setSystems }) {
// //   const { user, token } = useAuth();

// //   const handleApprove = async (systemId) => {
// //     const res = await fetch(`http://localhost:8000/api/v1/systems/${systemId}/approve`, {
// //       method: "PATCH",
// //       headers: { Authorization: `Bearer ${token}` },
// //     });

// //     if (res.ok) {
// //       setSystems((prev) =>
// //         prev.map((s) => s.id === systemId ? { ...s, is_approved: true } : s)
// //       );
// //     } else {
// //       alert("Approval failed");
// //     }
// //   };

// //   if (!systems?.length) return <div className="sidebar">No systems extracted.</div>;

// //   return (
// //     <div className="sidebar">
// //       <h3>Extracted Systems</h3>
// //       {systems.map((system) => (
// //         <div key={system.id} className="system-card">
// //           <h4>{system.name}</h4>
// //           <ReactMarkdown>{system.dr_data}</ReactMarkdown>
// //           <p><b>Dependencies:</b> {system.dependencies.join(", ")}</p>
// //           <p><b>Source:</b> {system.source_reference}</p>
// //           {user?.role === "admin" && !system.is_approved && (
// //             <button onClick={() => handleApprove(system.id)}>Approve</button>
// //           )}
// //           {system.is_approved && <span className="approved-badge">✅ Approved</span>}
// //         </div>
// //       ))}
// //     </div>
// //   );
// // }

// // export default Sidebar;
// // Sidebar.js
// // Sidebar.js
// import React from "react";

// function Sidebar({ systems, onSelect }) {
//   if (!systems?.length) return <div className="sidebar">No systems extracted.</div>;

//   return (
//     <div className="sidebar">
//       <h3>Extracted Systems</h3>
//       {systems.map((system) => (
//         <div key={system.id} className="system-title" onClick={() => onSelect(system)}>
//           {system.name}
//         </div>
//       ))}
//     </div>
//   );
// }

// export default Sidebar;
// Sidebar.js
import React, { useState } from "react";

function Sidebar({ systems, onSelect, selectedId }) {
  const [search, setSearch] = useState("");

  const filtered = systems?.filter(system =>
    system.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!systems?.length) return <div className="sidebar">No systems extracted.</div>;

  return (
    <div className="sidebar">
      <h3>Extracted Systems</h3>
      <input
        className="search-input"
        type="text"
        placeholder="Search systems..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.map((system) => (
        <div
          key={system.id}
          className={`system-title ${selectedId === system.id ? "selected" : ""}`}
          onClick={() => onSelect(system)}
        >
          {system.name} {system.is_approved && <span className="approved-check">✔️</span>}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;
