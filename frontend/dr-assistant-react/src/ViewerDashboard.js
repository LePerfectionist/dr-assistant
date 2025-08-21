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

function ViewerDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ 
    systems: 0,
    pending: 0,
    approved: 0
  });
  const [systems, setSystems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterApprover, setFilterApprover] = useState("");
  const [monthRange, setMonthRange] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCriticality, setFilterCriticality] = useState("");
  const [filterSystemType, setFilterSystemType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    dr_data: "",
    upstream_dependencies: "",
    downstream_dependencies: "",
    key_contacts: "",
    system_type: "internal",
    reason: ""
  });

  const systemsPerPage = 8;

  const fetchSystems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8000/api/v1/requests/viewer/systems`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const items = Array.isArray(data) ? data : [];
      const totalSystems = items.length;
      
      const pendingCount = items.filter(s => !s.is_approved).length;
      
      setSystems(items);
      setSummary({
        systems: totalSystems,
        pending: pendingCount,
        approved: totalSystems - pendingCount
      });
    } catch (error) {
      console.error('Error fetching systems:', error);
      setError(error.message);
      setSystems([]);
      setSummary({ systems: 0, pending: 0, approved: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchSystems();
    }
  }, [user?.token]);

  const getStatus = (system) => {
    return system.is_approved ? "Approved" : "Pending";
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
    const type = system.system_type || "unclassified";
    return (
      <span className={`system-type ${type.toLowerCase()}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const handleEditClick = (system) => {
    setSelectedSystem(system);
    setEditFormData({
      name: system.name || "",
      dr_data: system.dr_data || "",
      upstream_dependencies: Array.isArray(system.upstream_dependencies) 
        ? system.upstream_dependencies.join(", ") 
        : "",
      downstream_dependencies: Array.isArray(system.downstream_dependencies) 
        ? system.downstream_dependencies.join(", ") 
        : "",
      key_contacts: Array.isArray(system.key_contacts) 
        ? system.key_contacts.join(", ") 
        : "",
      system_type: system.system_type || "internal",
      reason: ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      if (!editFormData.reason.trim()) {
        alert("Please provide a reason for these changes.");
        return;
      }

      const changes = {};
      
      // Check which fields have changed
      if (editFormData.name !== selectedSystem.name) {
        changes.name = editFormData.name;
      }
      
      if (editFormData.dr_data !== selectedSystem.dr_data) {
        changes.dr_data = editFormData.dr_data;
      }
      
      const currentUpstream = Array.isArray(selectedSystem.upstream_dependencies) 
        ? selectedSystem.upstream_dependencies.join(", ") 
        : "";
      if (editFormData.upstream_dependencies !== currentUpstream) {
        changes.upstream_dependencies = editFormData.upstream_dependencies
          .split(",")
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      
      const currentDownstream = Array.isArray(selectedSystem.downstream_dependencies) 
        ? selectedSystem.downstream_dependencies.join(", ") 
        : "";
      if (editFormData.downstream_dependencies !== currentDownstream) {
        changes.downstream_dependencies = editFormData.downstream_dependencies
          .split(",")
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      
      const currentContacts = Array.isArray(selectedSystem.key_contacts) 
        ? selectedSystem.key_contacts.join(", ") 
        : "";
      if (editFormData.key_contacts !== currentContacts) {
        changes.key_contacts = editFormData.key_contacts
          .split(",")
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      
      if (editFormData.system_type !== selectedSystem.system_type) {
        changes.system_type = editFormData.system_type;
      }
      
      // If no changes were made
      if (Object.keys(changes).length === 0) {
        alert("No changes detected. Please modify at least one field.");
        return;
      }

      const response = await fetch('http://localhost:8000/api/v1/change-proposals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          system_id: selectedSystem.id,
          reason: editFormData.reason,
          changes: changes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit changes');
      }

      setSuccessMessage(`Change proposal submitted for ${selectedSystem.name}!`);
      setShowEditModal(false);
      setSelectedSystem(null);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error('Error submitting changes:', error);
      setError(error.message);
    }
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
      return (s.system_type || "unclassified") === filterSystemType.toLowerCase();
    });

  const paginatedSystems = filteredSystems.slice(
    (currentPage - 1) * systemsPerPage,
    currentPage * systemsPerPage
  );

  const statusChartData = [
    { name: "Approved", value: summary.approved, color: "#4CAF50" },
    { name: "Pending", value: summary.pending, color: "#F44336" }
  ];

  const criticalityChartData = [
    { name: "Low", value: filteredSystems.filter(s => getCriticalityLevel(s) === "Low").length, color: "#A4C52E" },
    { name: "Medium", value: filteredSystems.filter(s => getCriticalityLevel(s) === "Medium").length, color: "#FFEB3B" },
    { name: "High", value: filteredSystems.filter(s => getCriticalityLevel(s) === "High").length, color: "#FF9800" },
    { name: "Critical", value: filteredSystems.filter(s => getCriticalityLevel(s) === "Critical").length, color: "#F44336" }
  ];

  const systemTypeChartData = [
    { name: "Internal", value: systems.filter(s => s.system_type === "internal").length, color: "#2196F3" },
    { name: "External", value: systems.filter(s => s.system_type === "external").length, color: "#9C27B0" },
    { name: "Unclassified", value: systems.filter(s => !s.system_type || s.system_type === "unclassified").length, color: "#607D8B" }
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

  if (summary.systems === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>📊 Viewer Dashboard</h1>
        </div>

        <div className="no-applications-message">
          <div className="empty-state">
            <h2>No Systems Available Yet</h2>
            <p>There are currently no systems registered in the application.</p>
            <p>Please check back later or contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Viewer Dashboard</h1>
      </div>

      {error && <div className="error-message">Error: {error}</div>}
      
      {successMessage && (
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {successMessage}
        </div>
      )}

      <div className="summary-cards">
        <div className="card">
          <span className="card-icon">🗂</span>
          <span className="card-value">{summary.systems}</span>
          <span className="card-label">Systems</span>
        </div>
        <div className="card">
          <span className="card-icon">📌</span>
          <span className="card-value">{summary.pending}</span>
          <span className="card-label">Pending</span>
        </div>
        <div className="card">
          <span className="card-icon">✅</span>
          <span className="card-value">{summary.approved}</span>
          <span className="card-label">Approved</span>
        </div>
      </div>

      <div className="chart-row">
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

      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="🔍 Search system"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-input"
        />
        <input
          type="text"
          placeholder="👤 Filter by approver"
          value={filterApprover}
          onChange={(e) => {
            setFilterApprover(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-input"
        />
        <select 
          value={monthRange} 
          onChange={(e) => {
            setMonthRange(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="">All Time</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
        </select>
        <select
          value={filterCriticality}
          onChange={(e) => {
            setFilterCriticality(e.target.value);
            setCurrentPage(1);
          }}
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
          onChange={(e) => {
            setFilterSystemType(e.target.value);
            setCurrentPage(1);
          }}
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
              <th>Application ID</th>
              <th>Last Approved</th>
              <th>Approved By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSystems.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-systems-message">
                  {systems.length === 0 
                    ? 'No systems available' 
                    : 'No systems match current filters'}
                </td>
              </tr>
            ) : (
              paginatedSystems.map((system) => (
                <tr key={system.id}>
                  <td>{system.name}</td>
                  <td>{getSystemTypeTag(system)}</td>
                  <td>
                    <span className={`status-badge ${getStatus(system).toLowerCase()}`}>
                      {getStatus(system)}
                    </span>
                  </td>
                  <td>{getCriticalityTag(system)}</td>
                  <td>{system.application_id || "--"}</td>
                  <td>{formatDateTime(system.approved_at)}</td>
                  <td>{system.approved_by || "--"}</td>
                  <td className="actions-cell">
                    <button 
                      onClick={() => setSelectedSystem(system)}
                      className="view-button"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleEditClick(system)}
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
        {filteredSystems.length > systemsPerPage && (
          <div className="pagination-container">
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                &laquo; Previous
              </button>
              
              {Array.from(
                { length: Math.ceil(filteredSystems.length / systemsPerPage) },
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                )
              ).slice(
                Math.max(0, currentPage - 3),
                Math.min(Math.ceil(filteredSystems.length / systemsPerPage), currentPage + 2)
              )}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredSystems.length / systemsPerPage)))}
                disabled={currentPage === Math.ceil(filteredSystems.length / systemsPerPage)}
                className="pagination-button"
              >
                Next &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSystem && !showEditModal && (
        <Modal
          title={`System: ${selectedSystem.name}`}
          onClose={() => setSelectedSystem(null)}
        >
          <SystemDetail
            system={selectedSystem}
            user={user}
            isViewer={true}
            onClose={() => setSelectedSystem(null)}
          />
        </Modal>
      )}

      {showEditModal && selectedSystem && (
        <Modal
          title={`Edit System: ${selectedSystem.name}`}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSystem(null);
          }}
          width="600px"
        >
          <div className="edit-form">
            <div className="form-group">
              <label>System Name:</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>System Type:</label>
              <select
                value={editFormData.system_type}
                onChange={(e) => setEditFormData({...editFormData, system_type: e.target.value})}
                className="form-select"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="unclassified">Unclassified</option>
              </select>
            </div>

            <div className="form-group">
              <label>DR Data:</label>
              <textarea
                value={editFormData.dr_data}
                onChange={(e) => setEditFormData({...editFormData, dr_data: e.target.value})}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Upstream Dependencies (comma-separated):</label>
              <input
                type="text"
                value={editFormData.upstream_dependencies}
                onChange={(e) => setEditFormData({...editFormData, upstream_dependencies: e.target.value})}
                className="form-input"
                placeholder="Service A, Service B"
              />
            </div>

            <div className="form-group">
              <label>Downstream Dependencies (comma-separated):</label>
              <input
                type="text"
                value={editFormData.downstream_dependencies}
                onChange={(e) => setEditFormData({...editFormData, downstream_dependencies: e.target.value})}
                className="form-input"
                placeholder="Service X, Service Y"
              />
            </div>

            <div className="form-group">
              <label>Key Contacts (comma-separated emails):</label>
              <input
                type="text"
                value={editFormData.key_contacts}
                onChange={(e) => setEditFormData({...editFormData, key_contacts: e.target.value})}
                className="form-input"
                placeholder="user1@example.com, user2@example.com"
              />
            </div>

            <div className="form-group">
              <label>Reason for Changes:</label>
              <textarea
                value={editFormData.reason}
                onChange={(e) => setEditFormData({...editFormData, reason: e.target.value})}
                className="form-textarea"
                rows={3}
                placeholder="Please explain why these changes are needed..."
              />
            </div>

            <div className="form-actions">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSystem(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="btn-submit"
              >
                Submit Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ViewerDashboard;