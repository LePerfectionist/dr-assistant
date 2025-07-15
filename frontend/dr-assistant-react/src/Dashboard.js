// Dashboard.js
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import "./Dashboard.css";

function Dashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({ apps: 0, users: 0, pending: 0 });
  const [apps, setApps] = useState([]);
  const [systems, setSystems] = useState([]);
  const isAdmin = user?.role === "admin";

  const fetchSummary = async () => {
    try {
      const appsRes = await fetch(
        isAdmin
          ? "http://localhost:8000/api/v1/admin/applications"
          : "http://localhost:8000/api/v1/validation/applications",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const appsData = await appsRes.json();
      setApps(appsData);

      const systemsList = await Promise.all(
        appsData.map((app) =>
          fetch(
            `http://localhost:8000/api/v1/${
              isAdmin ? "admin" : "validation"
            }/applications/${app.id}/systems`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).then((r) => r.json())
        )
      );

      const allSystems = systemsList.flat();
      setSystems(allSystems);

      const pending = allSystems.filter((s) => !s.is_approved).length;
      const usersRes = isAdmin
        ? await fetch("http://localhost:8000/api/v1/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          })
        : { json: async () => [] };

      const users = await usersRes.json();
      setSummary({ apps: appsData.length, users: users.length, pending });
    } catch (err) {
      console.error("Dashboard error", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this system?")) return;
    const res = await fetch(`http://localhost:8000/api/v1/systems/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchSummary();
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    await fetch(`http://localhost:8000/api/v1/admin/applications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSummary();
  };

  return (
    <div className="dashboard-container">
      <h1>📊 Dashboard</h1>
      <div className="summary-cards">
        <div className="card">🗂 Applications: {summary.apps}</div>
        {isAdmin && <div className="card">👥 Users: {summary.users}</div>}
        <div className="card">📌 Pending Systems: {summary.pending}</div>
      </div>

      <h2>📂 Recent Applications</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            {isAdmin && <th>User</th>}
            <th>Uploaded</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id}>
              <td>#{a.id}</td>
              {isAdmin && <td>{a.user?.name || "-"}</td>}
              <td>{new Date(a.started_at).toLocaleDateString()}</td>
              <td>
                {systems.filter((s) => s.application_id === a.id && !s.is_approved).length > 0
                  ? "⏳ Pending"
                  : "✅ Approved"}
              </td>
              <td>
                <button onClick={() => alert("Not implemented: View app")}>View</button>
                {isAdmin && (
                  <button onClick={() => handleDeleteApp(a.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>📦 Recent Systems</h2>
      <table>
        <thead>
          <tr>
            <th>System</th>
            <th>App ID</th>
            <th>Uploaded By</th>
            <th>Approved?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {systems.slice(0, 10).map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>#{s.application_id}</td>
              <td>{s.approved_by || "-"}</td>
              <td>{s.is_approved ? "✅" : "❌"}</td>
              <td>
                <button onClick={() => alert("Not implemented: Edit")}>Edit</button>
                <button onClick={() => handleApprove(s.id)}>
                  {s.is_approved ? "Re-Approve" : "Approve"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
