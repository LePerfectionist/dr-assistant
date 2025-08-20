import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Modal from "./Modal";
import SystemDetail from "./SystemDetail";
import SystemEditModal from "./SystemEditModal";
import RequestApproval from "./RequestApproval";
import ApplicationChatbot from './ApplicationChatbot';
import ChatBubble from './ChatBubble';
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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [chatApplicationId, setChatApplicationId] = useState(null);

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

  const handleEditClick = (system) => {
    setSelectedSystem(system);
    setShowEditModal(true);
  };

  const handleRequestClick = (system) => {
    setSelectedSystem(system);
    setShowRequestModal(true);
  };

  const handleApplicationIdClick = (appId) => {
    setChatApplicationId(appId);
  };

  const handleEditSubmit = async (data) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/change-proposals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          system_id: selectedSystem.id,
          reason: data.reason,
          changes: data.changes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit changes');
      }

      const result = await response.json();
      setSuccessMessage(`Change proposal submitted for ${selectedSystem.name}! Changes: ${Object.keys(data.changes).join(', ')}`);
      setShowEditModal(false);
      setSelectedSystem(null);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRequestSubmit = async (reason) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          system_id: selectedSystem.id,
          reason: reason,
          request_type: selectedSystem.is_approved ? "change" : "approval"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit request');
      }

      setSuccessMessage(`${selectedSystem.is_approved ? 'Change' : 'Approval'} request submitted for ${selectedSystem.name}!`);
      setShowRequestModal(false);
      setSelectedSystem(null);
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchSystems(); // Refresh the data
    } catch (error) {
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

  // System Edit Modal Component
  const SystemEditModal = ({ system, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      name: system.name || '',
      dr_data: system.dr_data || '',
      upstream_dependencies: system.upstream_dependencies?.join(', ') || '',
      downstream_dependencies: system.downstream_dependencies?.join(', ') || '',
      key_contacts: system.key_contacts?.join(', ') || '',
      system_type: system.system_type || 'internal',
    });
    
    const [reason, setReason] = useState('');
    const [changedFields, setChangedFields] = useState(new Set());

    const handleFieldChange = (fieldName, value) => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));

      const originalValue = getOriginalValue(fieldName);
      const newChangedFields = new Set(changedFields);
      
      if (value !== originalValue) {
        newChangedFields.add(fieldName);
      } else {
        newChangedFields.delete(fieldName);
      }
      
      setChangedFields(newChangedFields);
    };

    const getOriginalValue = (fieldName) => {
      switch (fieldName) {
        case 'name': return system.name || '';
        case 'dr_data': return system.dr_data || '';
        case 'upstream_dependencies': return system.upstream_dependencies?.join(', ') || '';
        case 'downstream_dependencies': return system.downstream_dependencies?.join(', ') || '';
        case 'key_contacts': return system.key_contacts?.join(', ') || '';
        case 'system_type': return system.system_type || 'internal';
        default: return '';
      }
    };

    const handleSubmit = () => {
      if (changedFields.size === 0) {
        alert('No changes detected. Please modify at least one field.');
        return;
      }
      
      if (!reason.trim()) {
        alert('Please provide a reason for these changes.');
        return;
      }

      const changes = {};
      changedFields.forEach(fieldName => {
        let value = formData[fieldName];
        if (['upstream_dependencies', 'downstream_dependencies', 'key_contacts'].includes(fieldName)) {
          value = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
        changes[fieldName] = value;
      });

      onSubmit({ changes, reason });
    };

    return (
      <Modal
        title={`Propose Changes for ${system.name}`}
        onClose={onClose}
        width="600px"
      >
        <div style={{ marginBottom: '20px' }}>
          <strong>Changed Fields: </strong>
          {changedFields.size > 0 ? Array.from(changedFields).join(', ') : 'None'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              System Name:
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: changedFields.has('name') ? '2px solid #28a745' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: changedFields.has('name') ? '#f8fff9' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              System Type:
            </label>
            <select
              value={formData.system_type}
              onChange={(e) => handleFieldChange('system_type', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: changedFields.has('system_type') ? '2px solid #28a745' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: changedFields.has('system_type') ? '#f8fff9' : 'white'
              }}
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="unclassified">Unclassified</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              DR Data:
            </label>
            <textarea
              value={formData.dr_data}
              onChange={(e) => handleFieldChange('dr_data', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: changedFields.has('dr_data') ? '2px solid #28a745' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: changedFields.has('dr_data') ? '#f8fff9' : 'white',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Upstream Dependencies (comma-separated):
            </label>
            <input
              type="text"
              value={formData.upstream_dependencies}
              onChange={(e) => handleFieldChange('upstream_dependencies', e.target.value)}
              placeholder="Service A, Service B"
              style={{
                width: '100%',
                padding: '8px',
                border: changedFields.has('upstream_dependencies') ? '2px solid #28a745' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: changedFields.has('upstream_dependencies') ? '#f8fff9' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Downstream Dependencies (comma-separated):
            </label>
            <input
              type="text"
              value={formData.downstream_dependencies}
              onChange={(e) => handleFieldChange('downstream_dependencies', e.target.value)}
              placeholder="Service X, Service Y"
              style={{
                width: '100%',
                padding: '8px',
                border: changedFields.has('downstream_dependencies') ? '2px solid #28a745' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: changedFields.has('downstream_dependencies') ? '#f8fff9' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Key Contacts (comma-separated):
            </label>
            <input
              type="text"
              value={formData.key_contacts}
              onChange={(e) => handleFieldChange('key_contacts', e.target.value)}
              placeholder="user1@example.com, user2@example.com"
              style={{
                width: '100%',
                padding: '8px',
                border: changedFields.has('key_contacts') ? '2px solid #28a745' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: changedFields.has('key_contacts') ? '#f8fff9' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Reason for Changes:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Please explain why these changes are needed..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #ccc',
                background: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={changedFields.size === 0}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: changedFields.size === 0 ? '#ccc' : '#28a745',
                color: 'white',
                borderRadius: '4px',
                cursor: changedFields.size === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Submit Changes ({changedFields.size} field{changedFields.size !== 1 ? 's' : ''})
            </button>
          </div>
        </div>
      </Modal>
    );
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

        {/* General chat bubble remains available */}
        <ChatBubble token={user.token} />
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

        {/* Added Criticality Chart */}
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
                  <td>
                    {system.application_id ? (
                      <button 
                        className="app-id-button"
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
                      onClick={() => handleEditClick(system)}
                      className="edit-button"
                    >
                      ✏️ Edit
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

      {showEditModal && selectedSystem && (
        <SystemEditModal
          system={selectedSystem}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSystem(null);
          }}
          onSubmit={handleEditSubmit}
        />
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

      <ChatBubble token={user.token} />

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