import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Modal from "./Modal";
import SystemDetail from "./SystemDetail";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import "./Dashboard.css";

function Dashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({ apps: 0, users: 0, pending: 0 });
  const [apps, setApps] = useState([]);
  const [systems, setSystems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterApprover, setFilterApprover] = useState("");
  const [monthRange, setMonthRange] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCriticality, setFilterCriticality] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSystem, setSelectedSystem] = useState(null);
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

  useEffect(() => {
    fetchSummary();
  }, []);

  const getStatus = (s) => {
    if (!s.is_approved) return "Pending";
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(s.approved_at) < sixMonthsAgo
      ? "Due for Recertification"
      : "Approved";
  };

  const getCriticalityLevel = (system) => {
    const upstream = Array.isArray(system.upstream_dependencies)
      ? system.upstream_dependencies.length
      : 0;
    const downstream = Array.isArray(system.downstream_dependencies)
      ? system.downstream_dependencies.length
      : 0;
    const total = upstream + downstream;

    if (total >= 6) return "Critical";
    if (total >= 4) return "High";
    if (total >= 2) return "Medium";
    return "Low";
  };

  const getCriticalityTag = (system) => {
    const level = getCriticalityLevel(system);
    return (
      <span className={`criticality ${level.toLowerCase()}`}>
        {level} ({["Low", "Medium", "High", "Critical"].indexOf(level) + 1})
      </span>
    );
  };

  const filteredSystems = systems
    .filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((s) =>
      filterApprover
        ? (s.approved_by || "").toLowerCase().includes(filterApprover.toLowerCase())
        : true
    )
    .filter((s) => {
      if (!monthRange) return true;
      const months = parseInt(monthRange);
      const from = new Date();
      from.setMonth(from.getMonth() - months);
      const date = new Date(s.approved_at || s.created_at);
      return date >= from;
    })
    .filter((s) => {
      if (!filterStatus) return true;
      return getStatus(s) === filterStatus;
    })
    .filter((s) => {
      if (!filterCriticality) return true;
      return getCriticalityLevel(s) === filterCriticality;
    });

  const paginatedSystems = filteredSystems.slice(
    (currentPage - 1) * systemsPerPage,
    currentPage * systemsPerPage
  );

  const pieData = [
    {
      name: "Approved",
      value: systems.filter((s) => getStatus(s) === "Approved").length,
    },
    {
      name: "Pending",
      value: systems.filter((s) => getStatus(s) === "Pending").length,
    },
    {
      name: "Due for Recertification",
      value: systems.filter(
        (s) => getStatus(s) === "Due for Recertification"
      ).length,
    },
  ];

  const criticalityData = [
    {
      name: "Low",
      value: systems.filter((s) => getCriticalityLevel(s) === "Low").length,
    },
    {
      name: "Medium",
      value: systems.filter((s) => getCriticalityLevel(s) === "Medium").length,
    },
    {
      name: "High",
      value: systems.filter((s) => getCriticalityLevel(s) === "High").length,
    },
    {
      name: "Critical",
      value: systems.filter((s) => getCriticalityLevel(s) === "Critical").length,
    },
  ];

  return (
    <div className="dashboard-container">
      <h1>📊 Dashboard</h1>

      {/* ✅ CHARTS AT TOP */}
      <div className="chart-section dual-charts">
        <ResponsiveContainer width="50%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-status-${index}`}
                  fill={["#4caf50", "#f44336", "#ff9800"][index % 3]}
                />
              ))}
              <LabelList dataKey="name" position="outside" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="50%" height={300}>
          <PieChart>
            <Pie
              data={criticalityData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {criticalityData.map((entry, index) => (
                <Cell
                  key={`cell-criticality-${index}`}
                  fill={["#a4c52eff", "#ffeb3b", "#ff9800", "#f44336"][index % 4]}
                />
              ))}
              <LabelList dataKey="name" position="outside" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">🗂 Applications: {summary.apps}</div>
        {isAdmin && <div className="card">👥 Users: {summary.users}</div>}
        <div className="card">📌 Pending Systems: {summary.pending}</div>
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="🔍 Search system"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="text"
          placeholder="👤 Approver"
          value={filterApprover}
          onChange={(e) => setFilterApprover(e.target.value)}
        />
        <select value={monthRange} onChange={(e) => setMonthRange(e.target.value)}>
          <option value="">All Time</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Due for Recertification">Due for Reapproval</option>
        </select>
        <select
          value={filterCriticality}
          onChange={(e) => setFilterCriticality(e.target.value)}
        >
          <option value="">All Criticalities</option>
          <option value="Low">Low (1)</option>
          <option value="Medium">Medium (2)</option>
          <option value="High">High (3)</option>
          <option value="Critical">Critical (4)</option>
        </select>
      </div>

      {/* Systems Table */}
      <table>
        <thead>
          <tr>
            <th>System</th>
            <th>Status</th>
            <th>Criticality</th>
            <th>Last Approved</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSystems.length === 0 ? (
            <tr>
              <td colSpan="5">No systems found</td>
            </tr>
          ) : (
            paginatedSystems.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{getStatus(s)}</td>
                <td>{getCriticalityTag(s)}</td>
                <td>
                  {s.approved_at
                    ? new Date(s.approved_at).toLocaleString()
                    : "--"}
                </td>
                <td>
                  <button onClick={() => setSelectedSystem(s)}>✏️ Edit</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredSystems.length / systemsPerPage) },
          (_, i) => i + 1
        ).map((n) => (
          <button
            key={n}
            onClick={() => setCurrentPage(n)}
            className={n === currentPage ? "active-page" : ""}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Modal for Detail */}
      {selectedSystem && (
        <Modal
          title={selectedSystem.name}
          onClose={() => setSelectedSystem(null)}
        >
          <SystemDetail
            system={selectedSystem}
            user={user}
            onApprove={() => fetchSummary()}
            onUpdate={() => {
              fetchSummary();
              setSelectedSystem(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
