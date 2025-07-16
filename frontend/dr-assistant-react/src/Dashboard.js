import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Modal from "./Modal";
import SystemDetail from "./SystemDetail";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./Dashboard.css";

function Dashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({ apps: 0, users: 0, pending: 0 });
  const [apps, setApps] = useState([]);
  const [systems, setSystems] = useState([]);
  const [appModal, setAppModal] = useState(null);
  const [appSystems, setAppSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApprover, setFilterApprover] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tab, setTab] = useState("systems");
  const [currentPage, setCurrentPage] = useState(1);
  const [appSearchId, setAppSearchId] = useState("");
  const [appStartDate, setAppStartDate] = useState(null);
  const [appEndDate, setAppEndDate] = useState(null);
  const systemsPerPage = 8;

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

  const openAppModal = async (app) => {
    setAppModal(app);
    const res = await fetch(
      `http://localhost:8000/api/v1/${isAdmin ? "admin" : "validation"}/applications/${app.id}/systems`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setAppSystems(data);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this system?")) return;
    const res = await fetch(
      `http://localhost:8000/api/v1/${isAdmin ? "admin" : "validation"}/systems/${id}/approve`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
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

  useEffect(() => {
    fetchSummary();
  }, []);

  const filteredSystems = systems
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((s) => {
      if (filterStatus === "approved") return s.is_approved;
      if (filterStatus === "pending") return !s.is_approved;
      return true;
    })
    .filter((s) =>
      filterApprover
        ? s.approved_by?.toLowerCase().includes(filterApprover.toLowerCase())
        : true
    )
    .filter((s) => {
      const date = new Date(s.approved_at || s.created_at);
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });

  const paginatedSystems = filteredSystems.slice(
    (currentPage - 1) * systemsPerPage,
    currentPage * systemsPerPage
  );

  const pageCount = Math.ceil(filteredSystems.length / systemsPerPage);

  const pieData = [
    {
      name: "Approved",
      value: systems.filter((s) => s.is_approved).length,
    },
    {
      name: "Pending",
      value: systems.filter((s) => !s.is_approved).length,
    },
  ];

  const filteredApps = apps.filter((a) => {
    const matchesId = appSearchId ? String(a.id).includes(appSearchId) : true;
    const date = new Date(a.started_at);
    const matchesStart = appStartDate ? date >= appStartDate : true;
    const matchesEnd = appEndDate ? date <= appEndDate : true;
    return matchesId && matchesStart && matchesEnd;
  });

  return (
    <div className="dashboard-container">
      <h1>📊 Dashboard</h1>

      <div className="summary-cards">
        <div className="card">🗂 Applications: {summary.apps}</div>
        {isAdmin && <div className="card">👥 Users: {summary.users}</div>}
        <div className="card">📌 Pending Systems: {summary.pending}</div>
      </div>

      <div className="dashboard-tabs">
        <button className={tab === "apps" ? "active-tab" : ""} onClick={() => setTab("apps")}>📂 Applications</button>
        <button className={tab === "systems" ? "active-tab" : ""} onClick={() => setTab("systems")}>📦 Systems</button>
      </div>

      {tab === "apps" && (
        <>
          <h2>📂 Applications</h2>

          <div className="dashboard-filters">
            <input
              type="text"
              placeholder="Search by App ID"
              value={appSearchId}
              onChange={(e) => setAppSearchId(e.target.value)}
            />
            <label>
              Start Date:
              <DatePicker selected={appStartDate} onChange={(date) => setAppStartDate(date)} isClearable />
            </label>
            <label>
              End Date:
              <DatePicker selected={appEndDate} onChange={(date) => setAppEndDate(date)} isClearable />
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>App ID</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((a) => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td>{new Date(a.started_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => openAppModal(a)}>✏️ Edit</button>
                    {isAdmin && (
                      <button onClick={() => handleDeleteApp(a.id)}>🗑️ Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === "systems" && (
        <>
          <h2>📦 Systems</h2>

          <div className="dashboard-filters">
            <input
              type="text"
              placeholder="🔍 Search system"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">❌ Pending</option>
            </select>
            <input
              type="text"
              placeholder="👤 Approver"
              value={filterApprover}
              onChange={(e) => setFilterApprover(e.target.value)}
            />
            <label>
              Start Date:
              <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} isClearable />
            </label>
            <label>
              End Date:
              <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} isClearable />
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>System</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSystems.length === 0 ? (
                <tr>
                  <td colSpan="3">No systems found</td>
                </tr>
              ) : (
                paginatedSystems.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.is_approved ? `✅ ${s.approved_by || ""}` : "❌ Pending"}</td>
                    <td>
                      <button onClick={() => setSelectedSystem(s)}>✏️ Edit</button>
                      <button onClick={() => handleApprove(s.id)}>
                        {s.is_approved ? "🔁 Re-Approve" : "✅ Approve"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={n === currentPage ? "active-page" : ""}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="chart-section">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={["#2ecc71", "#e74c3c"][index % 2]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {appModal && (
        <Modal title={`Application #${appModal.id}`} onClose={() => setAppModal(null)}>
          <div>
            <p>
              <strong>Uploaded:</strong> {new Date(appModal.started_at).toLocaleString()}
            </p>
            <h4>Systems</h4>
            {appSystems.map((sys) => (
              <SystemDetail
                key={sys.id}
                system={{ ...sys, application_id: appModal.id }}
                user={user}
                onApprove={() => handleApprove(sys.id)}
                onUpdate={fetchSummary}
              />
            ))}
          </div>
        </Modal>
      )}

      {selectedSystem && (
        <Modal title={selectedSystem.name} onClose={() => setSelectedSystem(null)}>
          <SystemDetail
  system={selectedSystem}
  user={user}
  onApprove={() => handleApprove(selectedSystem.id)}
  onUpdate={() => {
    fetchSummary();
    setSelectedSystem(null); // closes modal after update
  }}
/>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
