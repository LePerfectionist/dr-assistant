import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import SystemModal from "./SystemModal";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplicationsAndSystems = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // Defensive check
      if (Array.isArray(data)) {
        setApplications(data);
      } else if (Array.isArray(data.applications)) {
        setApplications(data.applications);
        setSystems(data.systems || []);
      } else {
        console.error("Unexpected applications format:", data);
        setApplications([]);
        setSystems([]);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setApplications([]);
      setSystems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsAndSystems();
  }, []);

  const handleDeleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    const res = await fetch(`http://localhost:8000/api/v1/admin/applications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Failed to delete application");
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="dashboard-section">
            <h3>Applications ({applications.length})</h3>
            {applications.length > 0 ? (
              <ul className="dashboard-list">
                {applications.map((app) => (
                  <li key={app.id} className="dashboard-item">
                    <span>📁 Application #{app.id}</span>
                    <button onClick={() => handleDeleteApplication(app.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No applications found.</p>
            )}
          </div>

          <div className="dashboard-section">
            <h3>Systems ({systems.length})</h3>
            {systems.length > 0 ? (
              <ul className="dashboard-list">
                {systems.map((sys) => (
                  <li
                    key={sys.id}
                    className="dashboard-item clickable"
                    onClick={() => setSelectedSystem(sys)}
                  >
                    <div>
                      <strong>{sys.name}</strong>
                      <div className="small">
                        {sys.is_approved
                          ? `✅ Approved by ${sys.approved_by} at ${new Date(sys.approved_at).toLocaleString()} UTC`
                          : "❌ Not approved"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No systems found.</p>
            )}
          </div>
        </>
      )}

      {/* DR Data Modal for system view */}
      {selectedSystem && (
        <SystemModal
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
