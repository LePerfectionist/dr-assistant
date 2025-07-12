
// // Dashboard.js
// import React, { useEffect, useState } from "react";
// import { useAuth } from "./AuthContext";
// import ReactMarkdown from "react-markdown";
// import "./Dashboard.css";

// function Dashboard() {
//   const { user, token } = useAuth();
//   const [applications, setApplications] = useState([]);
//   const [selectedAppId, setSelectedAppId] = useState(null);
//   const [systems, setSystems] = useState([]);
//   const [selectedSystem, setSelectedSystem] = useState(null);
//   const [editMode, setEditMode] = useState(false);
//   const [editedData, setEditedData] = useState({
//     dr_data: "",
//     dependencies: "",
//     source_reference: ""
//   });

//   const fetchDashboardData = async () => {
//     const url = user.role === "admin"
//       ? "http://localhost:8000/api/v1/admin/applications"
//       : "http://localhost:8000/api/v1/applications";

//     const res = await fetch(url, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();
//     if (Array.isArray(data)) setApplications(data);
//     else setApplications(data.applications || []);
//   };

//   const fetchSystems = async (appId) => {
//     const url = user.role === "admin"
//       ? `http://localhost:8000/api/v1/admin/applications/${appId}/systems`
//       : `http://localhost:8000/api/v1/applications/${appId}/systems`;

//     const res = await fetch(url, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();
//     setSystems(data);
//     setSelectedSystem(null); // clear detail view when switching
//   };

//   const handleSystemClick = (sys) => {
//     setSelectedSystem(sys);
//     setEditMode(false);
//     setEditedData({
//       dr_data: sys.dr_data,
//       dependencies: sys.dependencies.join(", "),
//       source_reference: sys.source_reference || ""
//     });
//   };

//   const handleApprove = async (id) => {
//     const confirm = window.confirm("Approve this system?");
//     if (!confirm) return;
//     const res = await fetch(`http://localhost:8000/api/v1/systems/${id}/approve`, {
//       method: "PATCH",
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     if (res.ok) fetchSystems(selectedAppId);
//   };

//   const handleSave = async () => {
//     const confirm = window.confirm("Save changes?");
//     if (!confirm) return;
//     const res = await fetch(`http://localhost:8000/api/v1/systems/${selectedSystem.id}/update`, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         dr_data: editedData.dr_data,
//         dependencies: editedData.dependencies.split(",").map(d => d.trim()),
//         source_reference: editedData.source_reference
//       }),
//     });
//     if (res.ok) {
//       alert("Updated");
//       fetchSystems(selectedAppId);
//       setEditMode(false);
//     } else {
//       alert("Failed to update system.");
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   return (
//     <div className="dashboard-container">
//       <div className="app-list">
//         <h2>{user.role === "admin" ? "All Applications" : "My Applications"}</h2>
//         <ul>
//           {applications.map((app) => (
//             <li
//               key={app.id}
//               className={selectedAppId === app.id ? "selected" : ""}
//               onClick={() => {
//                 setSelectedAppId(app.id);
//                 fetchSystems(app.id);
//               }}
//             >
//               {app.name || `Application #${app.id}`}
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div className="system-list">
//         <h2>Systems</h2>
//         <ul>
//           {systems.map((sys) => (
//             <li key={sys.id} onClick={() => handleSystemClick(sys)}>
//               <strong>{sys.name}</strong>
//               {sys.is_approved && (
//                 <div className="badge">
//                   ✅ {sys.approved_by} at {new Date(sys.approved_at).toLocaleString()} UTC
//                 </div>
//               )}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* 👉 Right side DR Detail Panel */}
//       {selectedSystem && (
//         <div className="system-detail-panel">
//           <h2>{selectedSystem.name}</h2>

//           {editMode ? (
//             <>
//               <label>DR Data:</label>
//               <textarea
//                 rows="6"
//                 name="dr_data"
//                 value={editedData.dr_data}
//                 onChange={(e) => setEditedData({ ...editedData, dr_data: e.target.value })}
//               />
//               <label>Dependencies (comma-separated):</label>
//               <input
//                 value={editedData.dependencies}
//                 onChange={(e) => setEditedData({ ...editedData, dependencies: e.target.value })}
//               />
//               <label>Source Reference:</label>
//               <input
//                 value={editedData.source_reference}
//                 onChange={(e) => setEditedData({ ...editedData, source_reference: e.target.value })}
//               />
//               <button onClick={handleSave}>💾 Save</button>
//               <button onClick={() => setEditMode(false)}>Cancel</button>
//             </>
//           ) : (
//             <>
//               <ReactMarkdown>{selectedSystem.dr_data}</ReactMarkdown>
//               <p><b>Dependencies:</b> {selectedSystem.dependencies.join(", ")}</p>
//               <p><b>Source:</b> {selectedSystem.source_reference}</p>
//               {(user.role === "admin" || user.role === "checker") && (
//                 <button onClick={() => setEditMode(true)}>✏️ Edit</button>
//               )}
//               {!selectedSystem.is_approved && (
//                 <button onClick={() => handleApprove(selectedSystem.id)}>✅ Approve</button>
//               )}
//               {selectedSystem.is_approved && (
//                 <div className="badge">
//                   ✅ Approved by {selectedSystem.approved_by}<br />
//                   🕒 {new Date(selectedSystem.approved_at).toLocaleString()} UTC
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default Dashboard;
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import ReactMarkdown from "react-markdown";
import "./Dashboard.css";

function Dashboard() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    dr_data: "",
    dependencies: "",
    source_reference: ""
  });

  const fetchDashboardData = async () => {
    const url = user.role === "admin"
      ? "http://localhost:8000/api/v1/admin/applications"
      : "http://localhost:8000/api/v1/applications";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setApplications(data);
    else setApplications(data.applications || []);
  };

  const fetchSystems = async (appId) => {
    const url = user.role === "admin"
      ? `http://localhost:8000/api/v1/admin/applications/${appId}/systems`
      : `http://localhost:8000/api/v1/applications/${appId}/systems`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSystems(data);
    setSelectedSystem(null);
  };

  const handleSystemClick = (sys) => {
    setSelectedSystem(sys);
    setEditMode(false);
    setEditedData({
      dr_data: sys.dr_data,
      dependencies: sys.dependencies.join(", "),
      source_reference: sys.source_reference || ""
    });
  };

  const handleApprove = async (id) => {
    const confirm = window.confirm("Approve this system?");
    if (!confirm) return;
    const res = await fetch(`http://localhost:8000/api/v1/systems/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchSystems(selectedAppId);
  };

  const handleSave = async () => {
    const confirm = window.confirm("Save changes?");
    if (!confirm) return;
    const res = await fetch(`http://localhost:8000/api/v1/systems/${selectedSystem.id}/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        dr_data: editedData.dr_data,
        dependencies: editedData.dependencies.split(",").map(d => d.trim()),
        source_reference: editedData.source_reference
      }),
    });
    if (res.ok) {
      alert("Updated");
      fetchSystems(selectedAppId);
      setEditMode(false);
    } else {
      alert("Failed to update system.");
    }
  };

  const handleDeleteSystem = async (id) => {
    const confirm = window.confirm("Delete this state/system?");
    if (!confirm) return;
    const res = await fetch(`http://localhost:8000/api/v1/systems/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert("System deleted.");
      fetchSystems(selectedAppId);
    } else {
      alert("Failed to delete system.");
    }
  };

  const handleDeleteApplication = async (id) => {
    const confirm = window.confirm("Delete this application and all its systems?");
    if (!confirm) return;
    const res = await fetch(`http://localhost:8000/api/v1/applications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      alert("Application deleted.");
      fetchDashboardData();
      setSelectedAppId(null);
      setSystems([]);
      setSelectedSystem(null);
    } else {
      alert("Failed to delete application.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="app-list">
        <h2>{user.role === "admin" ? "All Applications" : "My Applications"}</h2>
        <ul>
          {applications.map((app) => (
            <li
              key={app.id}
              className={selectedAppId === app.id ? "selected" : ""}
              onClick={() => {
                setSelectedAppId(app.id);
                fetchSystems(app.id);
              }}
            >
              {app.name || `Application #${app.id}`}
              {user.role === "admin" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteApplication(app.id);
                  }}
                  className="delete-btn"
                >
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="system-list">
        <h2>States</h2>
        <ul>
          {systems.map((sys) => (
            <li key={sys.id} onClick={() => handleSystemClick(sys)}>
              <strong>{sys.name}</strong>
              {sys.is_approved && (
                <div className="badge">
                  ✅ {sys.approved_by} at {new Date(sys.approved_at).toLocaleString()} UTC
                </div>
              )}
              {user.role === "admin" && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSystem(sys.id);
                  }}
                >
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {selectedSystem && (
        <div className="system-detail-panel">
          <h2>{selectedSystem.name}</h2>

          {editMode ? (
            <>
              <label>DR Data:</label>
              <textarea
                rows="6"
                name="dr_data"
                value={editedData.dr_data}
                onChange={(e) => setEditedData({ ...editedData, dr_data: e.target.value })}
              />
              <label>Dependencies (comma-separated):</label>
              <input
                value={editedData.dependencies}
                onChange={(e) => setEditedData({ ...editedData, dependencies: e.target.value })}
              />
              <label>Source Reference:</label>
              <input
                value={editedData.source_reference}
                onChange={(e) => setEditedData({ ...editedData, source_reference: e.target.value })}
              />
              <button onClick={handleSave}>💾 Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <>
              <ReactMarkdown>{selectedSystem.dr_data}</ReactMarkdown>
              <p><b>Dependencies:</b> {selectedSystem.dependencies.join(", ")}</p>
              <p><b>Source:</b> {selectedSystem.source_reference}</p>
              {(user.role === "admin" || user.role === "checker") && (
                <button onClick={() => setEditMode(true)}>✏️ Edit</button>
              )}
              {!selectedSystem.is_approved && (
                <button onClick={() => handleApprove(selectedSystem.id)}>✅ Approve</button>
              )}
              {selectedSystem.is_approved && (
                <div className="badge">
                  ✅ Approved by {selectedSystem.approved_by}<br />
                  🕒 {new Date(selectedSystem.approved_at).toLocaleString()} UTC
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
