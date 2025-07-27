import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Modal from "./Modal";
import SystemDetail from "./SystemDetail";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "./Dashboard.css";

function Dashboard() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ 
    apps: 0, 
    users: 0, 
    pending: 0,
    dueForReapproval: 0 
  });
  const [apps, setApps] = useState([]);
  const [systems, setSystems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterApprover, setFilterApprover] = useState("");
  const [monthRange, setMonthRange] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCriticality, setFilterCriticality] = useState("");
  const [filterSystemType, setFilterSystemType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showCreateExternalModal, setShowCreateExternalModal] = useState(false);
  const [newExternalSystem, setNewExternalSystem] = useState({
    name: "",
    applicationId: "",
    dr_data: "",
    system_type: "external",
    upstream_dependencies: [],
    downstream_dependencies: [],
    key_contacts: []
  });
  
  const systemsPerPage = 8;
  const isAdmin = user?.role === "admin";

  const fetchSystemStatus = async (systemId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/validation/systems/${systemId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error("Error fetching system status:", error);
      return "Approved";
    }
  };

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      
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
      const systemsWithStatus = await Promise.all(
        allSystems.map(async (system) => {
          const status = await fetchSystemStatus(system.id);
          return { 
            ...system, 
            currentStatus: status,
            systemType: system.system_type || "unclassified"
          };
        })
      );

      setSystems(systemsWithStatus);

      const pendingCount = systemsWithStatus.filter(s => s.currentStatus === "Pending").length;
      const dueForReapprovalCount = systemsWithStatus.filter(s => s.currentStatus === "Due for Reapproval").length;

      const usersRes = isAdmin
        ? await fetch("http://localhost:8000/api/v1/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          })
        : { json: async () => [] };

      const users = await usersRes.json();
      
      setSummary({ 
        apps: appsData.length, 
        users: users.length, 
        pending: pendingCount,
        dueForReapproval: dueForReapprovalCount
      });
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createExternalSystem = async () => {
    try {
      if (!newExternalSystem.name.trim()) {
        alert("System name cannot be empty");
        return;
      }

      if (!newExternalSystem.applicationId) {
        alert("Please select an application");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/validation/applications/${newExternalSystem.applicationId}/systems/external`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newExternalSystem.name,
            system_type: newExternalSystem.system_type,
            dr_data: newExternalSystem.dr_data || `Manually created external system: ${newExternalSystem.name}`,
            upstream_dependencies: newExternalSystem.upstream_dependencies,
            downstream_dependencies: newExternalSystem.downstream_dependencies,
            key_contacts: newExternalSystem.key_contacts,
            source_reference: "Manually created via dashboard"
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create external system");
      }

      const createdSystem = await response.json();
      alert(`External system "${createdSystem.name}" created successfully!`);
      setShowCreateExternalModal(false);
      setNewExternalSystem({
        name: "",
        applicationId: "",
        dr_data: "",
        system_type: "external",
        upstream_dependencies: [],
        downstream_dependencies: [],
        key_contacts: []
      });
      fetchSummary();
    } catch (error) {
      console.error("Error creating external system:", error);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const getStatus = (system) => {
    return system.currentStatus || "Approved";
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

  const getSystemTypeTag = (system) => {
    const type = system.systemType || "unclassified";
    return (
      <span className={`system-type ${type.toLowerCase()}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const filteredSystems = systems
    .filter((s) => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
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
    })
    .filter((s) => {
      if (!filterSystemType) return true;
      return s.systemType === filterSystemType.toLowerCase();
    });

  const paginatedSystems = filteredSystems.slice(
    (currentPage - 1) * systemsPerPage,
    currentPage * systemsPerPage
  );

  const statusChartData = [
    { name: "Approved", value: filteredSystems.filter(s => getStatus(s) === "Approved").length, color: "#4CAF50" },
    { name: "Pending", value: filteredSystems.filter(s => getStatus(s) === "Pending").length, color: "#F44336" },
    { name: "Due for Reapproval", value: filteredSystems.filter(s => getStatus(s) === "Due for Reapproval").length, color: "#FF9800" }
  ];

  const criticalityChartData = [
    { name: "Low", value: filteredSystems.filter(s => getCriticalityLevel(s) === "Low").length, color: "#A4C52E" },
    { name: "Medium", value: filteredSystems.filter(s => getCriticalityLevel(s) === "Medium").length, color: "#FFEB3B" },
    { name: "High", value: filteredSystems.filter(s => getCriticalityLevel(s) === "High").length, color: "#FF9800" },
    { name: "Critical", value: filteredSystems.filter(s => getCriticalityLevel(s) === "Critical").length, color: "#F44336" }
  ];

  const systemTypeChartData = [
    { name: "Internal", value: filteredSystems.filter(s => s.systemType === "internal").length, color: "#2196F3" },
    { name: "External", value: filteredSystems.filter(s => s.systemType === "external").length, color: "#9C27B0" },
    { name: "Unclassified", value: filteredSystems.filter(s => !s.systemType || s.systemType === "unclassified").length, color: "#607D8B" }
  ];

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>📊 Dashboard</h1>

      <div className="dashboard-actions">
        <button 
          className="create-external-btn"
          onClick={() => setShowCreateExternalModal(true)}
        >
          ➕ Create External System
        </button>
      </div>

      <div className="chart-row">
        {/* Status Pie Chart */}
        <div className="chart-wrapper">
          <h3>System Status</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} systems`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Criticality Bar Chart */}
        <div className="chart-wrapper">
          <h3>System Criticality</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={criticalityChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Systems">
                  {criticalityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Type Pie Chart */}
        <div className="chart-wrapper">
          <h3>System Type</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={systemTypeChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {systemTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="summary-cards">
        <div className="card">
          <span className="card-icon">🗂</span>
          <span className="card-value">{summary.apps}</span>
          <span className="card-label">Applications</span>
        </div>
        {isAdmin && (
          <div className="card">
            <span className="card-icon">👥</span>
            <span className="card-value">{summary.users}</span>
            <span className="card-label">Users</span>
          </div>
        )}
        <div className="card">
          <span className="card-icon">📌</span>
          <span className="card-value">{summary.pending}</span>
          <span className="card-label">Pending</span>
        </div>
        <div className="card">
          <span className="card-icon">⚠️</span>
          <span className="card-value">{summary.dueForReapproval}</span>
          <span className="card-label">Due for Reapproval</span>
        </div>
      </div>

      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="🔍 Search system"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
        />
        <input
          type="text"
          placeholder="👤 Filter by approver"
          value={filterApprover}
          onChange={(e) => setFilterApprover(e.target.value)}
          className="filter-input"
        />
        <select 
          value={monthRange} 
          onChange={(e) => setMonthRange(e.target.value)}
          className="filter-select"
        >
          <option value="">All Time</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={handleStatusFilterChange}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Due for Reapproval">Due for Reapproval</option>
        </select>
        <select
          value={filterCriticality}
          onChange={(e) => setFilterCriticality(e.target.value)}
          className="filter-select"
        >
          <option value="">All Criticalities</option>
          <option value="Low">Low (1)</option>
          <option value="Medium">Medium (2)</option>
          <option value="High">High (3)</option>
          <option value="Critical">Critical (4)</option>
        </select>
        <select
          value={filterSystemType}
          onChange={(e) => setFilterSystemType(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="internal">Internal</option>
          <option value="external">External</option>
          <option value="unclassified">Unclassified</option>
        </select>
      </div>

      <div className="systems-table-container">
        <table className="systems-table">
          <thead>
            <tr>
              <th>System</th>
              <th>Type</th>
              <th>Status</th>
              <th>Criticality</th>
              <th>Last Approved</th>
              <th>Approved By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSystems.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-systems-message">
                  No systems found matching your filters
                </td>
              </tr>
            ) : (
              paginatedSystems.map((system) => (
                <tr key={system.id}>
                  <td>{system.name}</td>
                  <td>{getSystemTypeTag(system)}</td>
                  <td>
                    <span className={`status-badge ${getStatus(system).toLowerCase().replace(/\s+/g, '-')}`}>
                      {getStatus(system)}
                    </span>
                  </td>
                  <td>{getCriticalityTag(system)}</td>
                  <td>
                    {formatDateTime(system.approved_at)}
                  </td>
                  <td>{system.approved_by || "--"}</td>
                  <td>
                    <button 
                      onClick={() => setSelectedSystem(system)}
                      className="edit-button"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredSystems.length > systemsPerPage && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {Array.from(
            { length: Math.ceil(filteredSystems.length / systemsPerPage) },
            (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={currentPage === i + 1 ? "active-page" : ""}
              >
                {i + 1}
              </button>
            )
          )}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredSystems.length / systemsPerPage)))}
            disabled={currentPage === Math.ceil(filteredSystems.length / systemsPerPage)}
          >
            Next
          </button>
        </div>
      )}

      {selectedSystem && (
        <Modal
          title={`System: ${selectedSystem.name}`}
          onClose={() => setSelectedSystem(null)}
        >
          <SystemDetail
            system={selectedSystem}
            user={user}
            onApprove={() => {
              fetchSummary();
              setSelectedSystem(null);
            }}
            onUpdate={() => {
              fetchSummary();
              setSelectedSystem(null);
            }}
          />
        </Modal>
      )}

      {/* Create External System Modal */}
      {showCreateExternalModal && (
        <Modal
          title="Create New External System"
          onClose={() => setShowCreateExternalModal(false)}
        >
          <div className="create-external-form">
            <div className="form-group">
              <label>System Name</label>
              <input
                type="text"
                value={newExternalSystem.name}
                onChange={(e) => setNewExternalSystem({...newExternalSystem, name: e.target.value})}
                placeholder="Enter system name"
              />
            </div>

            <div className="form-group">
              <label>Application</label>
              <select
                value={newExternalSystem.applicationId}
                onChange={(e) => setNewExternalSystem({...newExternalSystem, applicationId: e.target.value})}
              >
                <option value="">Select Application</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>
                    App #{app.id} - {app.user_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>System Type</label>
              <select
                value={newExternalSystem.system_type}
                onChange={(e) => setNewExternalSystem({...newExternalSystem, system_type: e.target.value})}
              >
                <option value="external">External</option>
                <option value="internal">Internal</option>
                <option value="unclassified">Unclassified</option>
              </select>
            </div>

            <div className="form-group">
              <label>DR Data</label>
              <textarea
                value={newExternalSystem.dr_data}
                onChange={(e) => setNewExternalSystem({...newExternalSystem, dr_data: e.target.value})}
                placeholder="Enter DR data description"
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowCreateExternalModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-submit"
                onClick={createExternalSystem}
              >
                Create System
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;