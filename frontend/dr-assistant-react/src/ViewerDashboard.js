import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Modal from "./Modal";
import SystemDetail from "./SystemDetail";
import RequestApproval from "./RequestApproval";
import ApplicationChatbot from './ApplicationChatbot';
import ChatBubble from './ChatBubble'; // Import the general chat bubble
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
  const [filterSystemType, setFilterSystemType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [error, setError] = useState(null);
  const [chatApplicationId, setChatApplicationId] = useState(null); // State for the application-specific chat

  const systemsPerPage = 8;

  const fetchSystems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:8000/api/v1/requests/viewer/systems?page=${currentPage}&search=${searchTerm}`,
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
      
      const items = Array.isArray(data) ? data : data.items || [];
      const totalSystems = data.total_count || items.length;
      
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
  }, [user?.token, currentPage, searchTerm]);

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

  const handleRequestClick = (system) => {
    setSelectedSystem(system);
    setShowRequestModal(true);
  };

  // This function now sets the application ID to open the specific chat
  const handleApplicationIdClick = (appId) => {
    setChatApplicationId(appId);
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
      if (!filterSystemType) return true;
      return s.system_type === filterSystemType.toLowerCase();
    });

  const paginatedSystems = filteredSystems.slice(
    (currentPage - 1) * systemsPerPage,
    currentPage * systemsPerPage
  );

  const statusChartData = [
    { name: "Approved", value: summary.approved, color: "#4CAF50" },
    { name: "Pending", value: summary.pending, color: "#F44336" }
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Viewer Dashboard</h1>
        {/* The old chat toggle button is removed */}
      </div>

      {error && <div className="error-message">Error: {error}</div>}

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
        {/* ... other filters ... */}
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
                  <td>
                    {system.application_id ? (
                      <button 
                        className="app-id-button" // Simplified class name
                        onClick={() => handleApplicationIdClick(system.application_id)}
                      >
                        {system.application_id}
                      </button>
                    ) : (
                      '--'
                    )}
                  </td>
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
                      onClick={() => handleRequestClick(system)}
                      className={`request-button ${system.is_approved ? 'changes' : 'approval'}`}
                    >
                      {system.is_approved ? '✏️ Request Changes' : '✅ Request Approval'}
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
          {/* ... pagination buttons ... */}
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
            isViewer={true}
            onClose={() => setSelectedSystem(null)}
          />
        </Modal>
      )}

      {showRequestModal && selectedSystem && (
        <Modal
          title={`Request ${selectedSystem.is_approved ? 'Changes' : 'Approval'} for ${selectedSystem.name}`}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedSystem(null);
          }}
        >
          <RequestApproval 
            system={selectedSystem} 
            user={user}
            isApproved={selectedSystem.is_approved}
            onRequestSubmit={() => {
              setShowRequestModal(false);
              setSelectedSystem(null);
              fetchSystems();
            }}
          />
        </Modal>
      )}

      {/* The general-purpose chat bubble is always rendered */}
      <ChatBubble token={user.token} />

      {/* The application-specific chatbot is rendered only when an app ID is selected */}
      {chatApplicationId && (
        <ApplicationChatbot 
          token={user.token}
          onClose={() => setChatApplicationId(null)}
          applicationId={chatApplicationId}
        />
      )}
    </div>
  );
}

export default ViewerDashboard;