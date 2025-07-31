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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetApplicationState = () => {
    setSystems([]);
    setApplicationId(null);
    setSelectedSystem(null);
  };

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
      resetApplicationState();
      setAppName("");
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
      if (selectedSystem?.id === id) setSelectedSystem(filtered[0] || null);
    } else {
      alert("Failed to delete system.");
    }
  };

   return (
    <div className="main-app-container">
      {step === "name" && (
        <div className="app-creation-card">
          <div className="app-creation-header">
            <h2 className="app-creation-title">Create New Application</h2>
            <p className="app-creation-subtitle">
              Start by naming your application to organize your systems
            </p>
          </div>
          
          <div className="app-name-form">
            <div className="form-group">
              <label htmlFor="appName" className="form-label">
                Application Name
              </label>
              <input
                id="appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Customer Portal, Payment Gateway"
                className="form-input"
                required
                autoFocus
              />
              <p className="form-hint">
                Choose a descriptive name that identifies this application
              </p>
            </div>
            
            <div className="form-actions">
              <button
                onClick={() => {
                  resetApplicationState();
                  setStep("upload");
                }}
                disabled={!appName.trim() || isSubmitting}
                className={`primary-button ${!appName.trim() ? "disabled" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span> Processing...
                  </>
                ) : (
                  "Continue to Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "upload" && (
        <>
          <div className="upload-sidebar-container">
            <Upload
              token={token}
              appName={appName}
              setSystems={setSystems}
              setApplicationId={setApplicationId}
              onSelect={setSelectedSystem}
              selectedId={selectedSystem?.id}
              onBack={() => {
                resetApplicationState();
                setStep("name");
              }}
              onNewUpload={() => resetApplicationState()}
            />
            <Sidebar
              systems={systems}
              selectedId={selectedSystem?.id}
              onSelect={setSelectedSystem}
            />
          </div>

          {systems.length > 0 ? (
            <>
              <div className="detail-section">
                <SystemDetail
                  system={selectedSystem || systems[0]}
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
          ) : (
            <div className="empty-state">
              <p>Upload a runbook to get started</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}