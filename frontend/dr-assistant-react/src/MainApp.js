// // MainApp.js
// import React, { useState } from "react";
// import { useAuth } from "./AuthContext";
// import Upload from "./Upload";
// import Sidebar from "./Sidebar";
// import SystemDetail from "./SystemDetail";
// import ChatBubble from "./ChatBubble";
// import AdminDashboard from "./AdminDashboard";
// import "./MainApp.css";

// export default function MainApp() {
//   const { user, token } = useAuth();
//   const [systems, setSystems] = useState([]);
//   const [applicationId, setApplicationId] = useState(null);
//   const [selectedSystem, setSelectedSystem] = useState(null);

//   const handleApprove = async (id) => {
//     try {
//       const res = await fetch(`http://localhost:8000/api/v1/systems/${id}/approve`, {
//         method: "PATCH",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.ok) {
//         const updated = await res.json();
//         setSystems((prev) =>
//           prev.map((sys) => (sys.id === id ? updated : sys))
//         );
//         if (selectedSystem?.id === id) setSelectedSystem(updated);
//       } else {
//         alert("Approval failed");
//       }
//     } catch (err) {
//       console.error("Error approving system:", err);
//       alert("Something went wrong while approving.");
//     }
//   };

//   const handleUpdate = (updatedSystem) => {
//     setSystems((prev) =>
//       prev.map((sys) => (sys.id === updatedSystem.id ? updatedSystem : sys))
//     );
//     setSelectedSystem(updatedSystem);
//   };

//   return (
//     <div className="main-app-container">
//       {user.role === "admin" ? (
//         <div className="admin-view">
//           <AdminDashboard
//             setSystems={setSystems}
//             onSystemSelect={setSelectedSystem}
//           />
//           <div className="detail-section">
//             <SystemDetail
//               system={selectedSystem}
//               user={{ ...user, token }}
//               onApprove={handleApprove}
//               onUpdate={handleUpdate}
//             />
//           </div>
//         </div>
//       ) : (
//         <>
//           <div className="upload-section">
//             <Upload
//               token={token}
//               setSystems={setSystems}
//               setApplicationId={setApplicationId}
//               onSelect={setSelectedSystem}
//               selectedId={selectedSystem?.id}
//             />
//           </div>

//           <div className="sidebar-section">
//             <Sidebar
//               systems={systems}
//               selectedId={selectedSystem?.id}
//               onSelect={setSelectedSystem}
//             />
//           </div>

//           <div className="detail-section">
//             <SystemDetail
//               system={selectedSystem}
//               user={{ ...user, token }}
//               onApprove={handleApprove}
//               onUpdate={handleUpdate}
//             />
//           </div>
//         </>
//       )}

//       <div className="chat-section">
//         <ChatBubble token={token} application={applicationId} />
//       </div>
//     </div>
//   );
// }
// MainApp.js
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import Upload from "./Upload";
import Sidebar from "./Sidebar";
import SystemDetail from "./SystemDetail";
import ChatBubble from "./ChatBubble";
import "./MainApp.css";

export default function MainApp() {
  const { user, token } = useAuth();
  const [systems, setSystems] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);

  const handleApprove = async (id) => {
    const res = await fetch(`http://localhost:8000/api/v1/systems/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const updated = await res.json();
      setSystems((prev) => prev.map((sys) => (sys.id === id ? updated : sys)));
      if (selectedSystem?.id === id) setSelectedSystem(updated);
    } else {
      alert("Approval failed");
    }
  };

  const handleUpdate = (updatedSystem) => {
    setSystems((prev) => prev.map((sys) => (sys.id === updatedSystem.id ? updatedSystem : sys)));
    if (selectedSystem?.id === updatedSystem.id) setSelectedSystem(updatedSystem);
  };

  const handleDeleteApp = async () => {
    if (!applicationId) return;
    const confirm = window.confirm("Delete this application and all associated systems?");
    if (!confirm) return;

    const res = await fetch(`http://localhost:8000/api/v1/admin/applications/${applicationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert("Application deleted.");
      setApplicationId(null);
      setSystems([]);
      setSelectedSystem(null);
    } else {
      alert("Failed to delete application.");
    }
  };

  const handleDeleteSystem = async (id) => {
    const confirm = window.confirm("Delete this system?");
    if (!confirm) return;

    const res = await fetch(`http://localhost:8000/api/v1/systems/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert("System deleted.");
      const filtered = systems.filter((s) => s.id !== id);
      setSystems(filtered);
      if (selectedSystem?.id === id) setSelectedSystem(null);
    } else {
      alert("Failed to delete system.");
    }
  };

  return (
    <div className="main-app-container">
      <div className="upload-sidebar-container">
        <Upload
          token={token}
          setSystems={setSystems}
          setApplicationId={setApplicationId}
          onSelect={setSelectedSystem}
          selectedId={selectedSystem?.id}
        />
        <Sidebar
          systems={systems}
          selectedId={selectedSystem?.id}
          onSelect={setSelectedSystem}
          onDeleteSystem={handleDeleteSystem}
          user={user}
          onDeleteApp={user?.role === "admin" ? handleDeleteApp : null}
        />
      </div>

      <div className="detail-section">
        <SystemDetail
          system={selectedSystem}
          user={{ ...user, token }}
          onApprove={handleApprove}
          onUpdate={handleUpdate}
        />
      </div>

      <div className="chat-section">
        <ChatBubble token={token} application={applicationId} />
      </div>
    </div>
  );
}
