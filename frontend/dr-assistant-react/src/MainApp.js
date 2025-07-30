
// import React, { useState } from "react";
// import { useAuth } from "./AuthContext";
// import Upload from "./Upload";
// import Sidebar from "./Sidebar";
// import SystemDetail from "./SystemDetail";
// import ChatBubble from "./ChatBubble";
// import "./MainApp.css";

// export default function MainApp() {
//   const { user, token } = useAuth();
//   const [systems, setSystems] = useState([]);
//   const [applicationId, setApplicationId] = useState(null);
//   const [selectedSystem, setSelectedSystem] = useState(null);

//   const handleApprove = async (id) => {
//     const url =
//       user.role === "admin"
//         ? `http://localhost:8000/api/v1/admin/systems/${id}/approve`
//         : `http://localhost:8000/api/v1/validation/systems/${id}/approve`;

//     try {
//       const res = await fetch(url, {
//         method: "PATCH",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.ok) {
//         const updated = await res.json();
//         setSystems((prev) => prev.map((sys) => (sys.id === id ? updated : sys)));
//         if (selectedSystem?.id === id) setSelectedSystem(updated);
//         alert("System approved!");
//       } else {
//         alert("Approval failed");
//       }
//     } catch (err) {
//       console.error("Error approving system:", err);
//       alert("Something went wrong while approving.");
//     }
//   };

//   const handleUpdate = (updatedSystem) => {
//     setSystems((prev) => prev.map((sys) => (sys.id === updatedSystem.id ? updatedSystem : sys)));
//     if (selectedSystem?.id === updatedSystem.id) setSelectedSystem(updatedSystem);
//   };

//   const handleDeleteApp = async () => {
//     if (!applicationId) return;
//     const confirm = window.confirm("Delete this application and all associated systems?");
//     if (!confirm) return;

//     const res = await fetch(`http://localhost:8000/api/v1/admin/applications/${applicationId}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (res.ok) {
//       alert("Application deleted.");
//       setApplicationId(null);
//       setSystems([]);
//       setSelectedSystem(null);
//     } else {
//       alert("Failed to delete application.");
//     }
//   };

//   const handleDeleteSystem = async (id) => {
//     const confirm = window.confirm("Delete this system?");
//     if (!confirm) return;

//     const res = await fetch(`http://localhost:8000/api/v1/systems/${id}`, {
//       method: "DELETE",
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     if (res.ok) {
//       alert("System deleted.");
//       const filtered = systems.filter((s) => s.id !== id);
//       setSystems(filtered);
//       if (selectedSystem?.id === id) setSelectedSystem(null);
//     } else {
//       alert("Failed to delete system.");
//     }
//   };

//   return (
//     <div className="main-app-container">
//       <div className="upload-sidebar-container">
//         <Upload
//           token={token}
//           setSystems={setSystems}
//           setApplicationId={setApplicationId}
//           onSelect={setSelectedSystem}
//           selectedId={selectedSystem?.id}
//         />
//         <Sidebar
//           systems={systems}
//           selectedId={selectedSystem?.id}
//           onSelect={setSelectedSystem}
//           onDeleteSystem={handleDeleteSystem}
//           user={user}
//           onDeleteApp={user?.role === "admin" ? handleDeleteApp : null}
//         />
//       </div>

//       <div className="detail-section">
//         <SystemDetail
//           system={selectedSystem}
//           user={{ ...user, token }}
//           onApprove={handleApprove}
//           onUpdate={handleUpdate}
//         />
//       </div>

//       <div className="chat-section">
//         <ChatBubble token={token} application={applicationId} />
//       </div>
//     </div>
//   );
// }

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
  const [appName, setAppName] = useState("");
  const [step, setStep] = useState("name");

  const handleApprove = async (id) => {
    const url =
      user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/systems/${id}/approve`
        : `http://localhost:8000/api/v1/validation/systems/${id}/approve`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updated = await res.json();
        setSystems((prev) => prev.map((sys) => (sys.id === id ? updated : sys)));
        if (selectedSystem?.id === id) setSelectedSystem(updated);
        alert("System approved!");
      } else {
        alert("Approval failed");
      }
    } catch (err) {
      console.error("Error approving system:", err);
      alert("Something went wrong while approving.");
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
      setAppName("");
      setStep("name");
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
      {step === "name" && (
        <div className="name-step">
          <h2>Create New Application</h2>
          <div className="name-input-container">
            <label htmlFor="appName">Application Name:</label>
            <input
              id="appName"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter application name"
              required
            />
          </div>
          <div className="name-step-buttons">
            <button
              onClick={() => setStep("upload")}
              disabled={!appName.trim()}
              className="next-button"
            >
              Next: Upload Runbook
            </button>
          </div>
        </div>
      )}

      {step === "upload" && (
        <>
          <div className="app-header">
  <h2>{appName}</h2>
  <button onClick={handleDeleteApp} className="delete-app-btn">
    Delete Application
  </button>
</div>
          <div className="upload-sidebar-container">
            <Upload
              token={token}
              appName={appName}
              setSystems={setSystems}
              setApplicationId={setApplicationId}
              onSelect={setSelectedSystem}
              selectedId={selectedSystem?.id}
              onBack={() => setStep("name")}
            />
            <Sidebar
              systems={systems}
              selectedId={selectedSystem?.id}
              onSelect={setSelectedSystem}
              onDeleteSystem={handleDeleteSystem}
              user={user}
              onDeleteApp={user?.role === "admin" ? handleDeleteApp : null}
              appName={appName}
            />
          </div>

          <div className="detail-section">
            <SystemDetail
              system={selectedSystem}
              user={{ ...user, token }}
              onApprove={handleApprove}
              onUpdate={handleUpdate}
              allSystems={systems}
            />
          </div>

          <div className="chat-section">
            <ChatBubble token={token} application={applicationId} />
          </div>
        </>
      )}
    </div>
  );
}