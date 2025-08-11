// // import React, { useEffect, useState } from 'react';
// // import { useAuth } from './AuthContext';
// // import RequestApproval from './RequestApproval';
// // import SystemDetails from './SystemDetails';
// // import './ViewerDashboard.css';

// // function ViewerDashboard() {
// //   const { user } = useAuth();
// //   const [systems, setSystems] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedSystem, setSelectedSystem] = useState(null);
// //   const [showDetails, setShowDetails] = useState(false);
// //   const [page, setPage] = useState(1);
// //   const [totalPages, setTotalPages] = useState(1);
// //   const [sortBy, setSortBy] = useState('name');
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [error, setError] = useState(null);

// //   const fetchSystems = async () => {
// //     try {
// //       setLoading(true);
// //       setError(null);
      
// //       const response = await fetch(
// //         `http://localhost:8000/api/v1/requests/viewer/systems?page=${page}&sort=${sortBy}&search=${searchTerm}`,
// //         {
// //           headers: {
// //             'Authorization': `Bearer ${user.token}`,
// //           },
// //         }
// //       );

// //       if (!response.ok) {
// //         throw new Error(`HTTP error! status: ${response.status}`);
// //       }

// //       const data = await response.json();
      
// //       // Maintain backward compatibility with both response formats
// //       const items = Array.isArray(data) ? data : data.items || [];
// //       const pages = data.total_pages || 1;
      
// //       setSystems(items);
// //       setTotalPages(pages);
// //     } catch (error) {
// //       console.error('Error fetching systems:', error);
// //       setError(error.message);
// //       setSystems([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     if (user?.token) {
// //       fetchSystems();
// //     }
// //   }, [user?.token, page, sortBy, searchTerm]);

// //   const handleSystemClick = (system) => {
// //     setSelectedSystem(system);
// //     setShowDetails(true);
// //   };

// //   const handleBackToList = () => {
// //     setShowDetails(false);
// //     setSelectedSystem(null);
// //   };

// //   const handleRequestClick = (system) => {
// //     if (window.confirm(`Are you sure you want to request ${system.is_approved ? 'changes' : 'approval'} for ${system.name}?`)) {
// //       setSelectedSystem(system);
// //     }
// //   };

// //   if (loading) return (
// //     <div className="loading-skeleton">
// //       {[...Array(5)].map((_, i) => (
// //         <div key={i} className="system-card-skeleton"></div>
// //       ))}
// //     </div>
// //   );

// //   return (
// //     <div className="viewer-dashboard">
// //       <h2>Viewer Dashboard</h2>
      
// //       {error && <div className="error-message">Error: {error}</div>}
      
// //       {!showDetails ? (
// //         <>
// //           <div className="dashboard-controls">
// //             <div className="search-sort-container">
// //               <input
// //                 type="text"
// //                 placeholder="Search systems..."
// //                 value={searchTerm}
// //                 onChange={(e) => {
// //                   setSearchTerm(e.target.value);
// //                   setPage(1);
// //                 }}
// //                 className="search-input"
// //               />
// //               <select 
// //                 value={sortBy} 
// //                 onChange={(e) => setSortBy(e.target.value)}
// //                 className="sort-select"
// //               >
// //                 <option value="name">Name (A-Z)</option>
// //                 <option value="-name">Name (Z-A)</option>
// //                 <option value="system_type">Type (A-Z)</option>
// //                 <option value="-system_type">Type (Z-A)</option>
// //                 <option value="is_approved">Status (Approved first)</option>
// //                 <option value="-is_approved">Status (Pending first)</option>
// //               </select>
// //             </div>
// //           </div>

// //           <div className="systems-list">
// //             {systems.length > 0 ? (
// //               systems.map((system) => (
// //                 <div 
// //                   key={system.id} 
// //                   className={`system-card ${system.is_approved ? 'approved' : 'pending'}`}
// //                   onClick={() => handleSystemClick(system)}
// //                 >
// //                   <div className="system-info">
// //                     <h3>{system.name}</h3>
// //                     <p>Type: {system.system_type}</p>
// //                     <p className="status">
// //                       Status: <span className={`status-badge ${system.is_approved ? 'approved' : 'pending'}`}>
// //                         {system.is_approved ? 'Approved' : 'Pending'}
// //                       </span>
// //                     </p>
// //                   </div>
// //                   <button 
// //                     onClick={(e) => {
// //                       e.stopPropagation();
// //                       handleRequestClick(system);
// //                     }}
// //                     className={`request-btn ${system.is_approved ? 'changes' : 'approval'}`}
// //                   >
// //                     {system.is_approved ? 'Request Changes' : 'Request Approval'}
// //                   </button>
// //                 </div>
// //               ))
// //             ) : (
// //               <div className="no-systems">
// //                 <p>No systems found</p>
// //                 <button onClick={() => {
// //                   setSearchTerm('');
// //                   setPage(1);
// //                   fetchSystems();
// //                 }}>
// //                   Reset filters
// //                 </button>
// //               </div>
// //             )}
// //           </div>

// //           {systems.length > 0 && totalPages > 1 && (
// //             <div className="pagination-controls">
// //               <button 
// //                 disabled={page === 1} 
// //                 onClick={() => setPage(p => p - 1)}
// //                 className="pagination-btn"
// //               >
// //                 &larr; Previous
// //               </button>
// //               <span className="page-info">Page {page} of {totalPages}</span>
// //               <button 
// //                 disabled={page === totalPages} 
// //                 onClick={() => setPage(p => p + 1)}
// //                 className="pagination-btn"
// //               >
// //                 Next &rarr;
// //               </button>
// //             </div>
// //           )}
// //         </>
// //       ) : (
// //         <SystemDetails 
// //           system={selectedSystem} 
// //           onBack={handleBackToList}
// //           onRequest={() => {
// //             if (window.confirm(`Are you sure you want to request ${selectedSystem.is_approved ? 'changes' : 'approval'} for ${selectedSystem.name}?`)) {
// //               setShowDetails(false);
// //               setSelectedSystem(selectedSystem);
// //             }
// //           }}
// //         />
// //       )}

// //       {selectedSystem && !showDetails && (
// //         <div className="request-modal">
// //           <div className="modal-content">
// //             <button 
// //               className="close-btn" 
// //               onClick={() => setSelectedSystem(null)}
// //               aria-label="Close modal"
// //             >
// //               &times;
// //             </button>
// //             <RequestApproval 
// //               system={selectedSystem} 
// //               user={user}
// //               isApproved={selectedSystem.is_approved}
// //               onRequestSubmit={() => {
// //                 setSelectedSystem(null);
// //                 fetchSystems();
// //               }}
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default ViewerDashboard;

// import React, { useEffect, useState } from "react";
// import { useAuth } from "./AuthContext";
// import Modal from "./Modal";
// import SystemDetail from "./SystemDetail";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer
// } from "recharts";
// import "./Dashboard.css";

// function ViewerDashboard() {
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(true);
//   const [summary, setSummary] = useState({ 
//     systems: 0,
//     pending: 0,
//     approved: 0
//   });
//   const [systems, setSystems] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterApprover, setFilterApprover] = useState("");
//   const [monthRange, setMonthRange] = useState("");
//   const [filterStatus, setFilterStatus] = useState("");
//   const [filterSystemType, setFilterSystemType] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedSystem, setSelectedSystem] = useState(null);
//   const [error, setError] = useState(null);

//   const systemsPerPage = 8;

//   const fetchSystems = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const response = await fetch(
//         `http://localhost:8000/api/v1/requests/viewer/systems?page=${currentPage}&search=${searchTerm}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${user.token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
      
//       // Maintain backward compatibility with both response formats
//       const items = Array.isArray(data) ? data : data.items || [];
//       const totalSystems = data.total_count || items.length;
      
//       const pendingCount = items.filter(s => !s.is_approved).length;
      
//       setSystems(items);
//       setSummary({
//         systems: totalSystems,
//         pending: pendingCount,
//         approved: totalSystems - pendingCount
//       });
//     } catch (error) {
//       console.error('Error fetching systems:', error);
//       setError(error.message);
//       setSystems([]);
//       setSummary({ systems: 0, pending: 0, approved: 0 });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (user?.token) {
//       fetchSystems();
//     }
//   }, [user?.token, currentPage, searchTerm]);

//   const getStatus = (system) => {
//     return system.is_approved ? "Approved" : "Pending";
//   };

//   const getCriticalityLevel = (system) => {
//     const upstream = Array.isArray(system.upstream_dependencies)
//       ? system.upstream_dependencies.length
//       : 0;
//     const downstream = Array.isArray(system.downstream_dependencies)
//       ? system.downstream_dependencies.length
//       : 0;
//     const total = upstream + downstream;

//     if (total >= 6) return "Critical";
//     if (total >= 4) return "High";
//     if (total >= 2) return "Medium";
//     return "Low";
//   };

//   const getCriticalityTag = (system) => {
//     const level = getCriticalityLevel(system);
//     return (
//       <span className={`criticality ${level.toLowerCase()}`}>
//         {level} ({["Low", "Medium", "High", "Critical"].indexOf(level) + 1})
//       </span>
//     );
//   };

//   const getSystemTypeTag = (system) => {
//     const type = system.system_type || "unclassified";
//     return (
//       <span className={`system-type ${type.toLowerCase()}`}>
//         {type.charAt(0).toUpperCase() + type.slice(1)}
//       </span>
//     );
//   };

//   const filteredSystems = systems
//     .filter((s) => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
//     .filter((s) =>
//       filterApprover
//         ? (s.approved_by || "").toLowerCase().includes(filterApprover.toLowerCase())
//         : true
//     )
//     .filter((s) => {
//       if (!monthRange) return true;
//       const months = parseInt(monthRange);
//       const from = new Date();
//       from.setMonth(from.getMonth() - months);
//       const date = new Date(s.approved_at || s.created_at);
//       return date >= from;
//     })
//     .filter((s) => {
//       if (!filterStatus) return true;
//       return getStatus(s) === filterStatus;
//     })
//     .filter((s) => {
//       if (!filterSystemType) return true;
//       return s.system_type === filterSystemType.toLowerCase();
//     });

//   const paginatedSystems = filteredSystems.slice(
//     (currentPage - 1) * systemsPerPage,
//     currentPage * systemsPerPage
//   );

//   const statusChartData = [
//     { name: "Approved", value: summary.approved, color: "#4CAF50" },
//     { name: "Pending", value: summary.pending, color: "#F44336" }
//   ];

//   const systemTypeChartData = [
//     { name: "Internal", value: systems.filter(s => s.system_type === "internal").length, color: "#2196F3" },
//     { name: "External", value: systems.filter(s => s.system_type === "external").length, color: "#9C27B0" },
//     { name: "Unclassified", value: systems.filter(s => !s.system_type || s.system_type === "unclassified").length, color: "#607D8B" }
//   ];

//   const handleStatusFilterChange = (e) => {
//     setFilterStatus(e.target.value);
//     setCurrentPage(1);
//   };

//   const formatDateTime = (dateString) => {
//     if (!dateString) return "--";
//     const date = new Date(dateString);
//     return date.toLocaleString();
//   };

//   if (isLoading) {
//     return (
//       <div className="dashboard-container">
//         <div className="loading-spinner">Loading dashboard data...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard-container">
//       {/* Header Row */}
//       <div className="dashboard-header">
//         <h1>📊 Viewer Dashboard</h1>
//       </div>

//       {error && <div className="error-message">Error: {error}</div>}

//       <div className="summary-cards">
//         <div className="card">
//           <span className="card-icon">🗂</span>
//           <span className="card-value">{summary.systems}</span>
//           <span className="card-label">Systems</span>
//         </div>
//         <div className="card">
//           <span className="card-icon">📌</span>
//           <span className="card-value">{summary.pending}</span>
//           <span className="card-label">Pending</span>
//         </div>
//         <div className="card">
//           <span className="card-icon">✅</span>
//           <span className="card-value">{summary.approved}</span>
//           <span className="card-label">Approved</span>
//         </div>
//       </div>

//       <div className="chart-row">
//         {/* Status Pie Chart */}
//         <div className="chart-wrapper">
//           <h3>System Status</h3>
//           <div className="chart-container">
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={statusChartData}
//                   dataKey="value"
//                   nameKey="name"
//                   outerRadius={80}
//                   label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                 >
//                   {statusChartData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value, name) => [`${value} systems`, name]} />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* System Type Pie Chart */}
//         <div className="chart-wrapper">
//           <h3>System Type</h3>
//           <div className="chart-container">
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={systemTypeChartData}
//                   dataKey="value"
//                   nameKey="name"
//                   outerRadius={80}
//                   label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                 >
//                   {systemTypeChartData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       <div className="dashboard-filters">
//         <input
//           type="text"
//           placeholder="🔍 Search system"
//           value={searchTerm}
//           onChange={(e) => {
//             setSearchTerm(e.target.value);
//             setCurrentPage(1);
//           }}
//           className="filter-input"
//         />
//         <input
//           type="text"
//           placeholder="👤 Filter by approver"
//           value={filterApprover}
//           onChange={(e) => setFilterApprover(e.target.value)}
//           className="filter-input"
//         />
//         <select 
//           value={monthRange} 
//           onChange={(e) => setMonthRange(e.target.value)}
//           className="filter-select"
//         >
//           <option value="">All Time</option>
//           <option value="3">Last 3 Months</option>
//           <option value="6">Last 6 Months</option>
//           <option value="12">Last 12 Months</option>
//         </select>
//         <select 
//           value={filterStatus} 
//           onChange={handleStatusFilterChange}
//           className="filter-select"
//         >
//           <option value="">All Statuses</option>
//           <option value="Pending">Pending</option>
//           <option value="Approved">Approved</option>
//         </select>
//         <select
//           value={filterSystemType}
//           onChange={(e) => setFilterSystemType(e.target.value)}
//           className="filter-select"
//         >
//           <option value="">All Types</option>
//           <option value="internal">Internal</option>
//           <option value="external">External</option>
//           <option value="unclassified">Unclassified</option>
//         </select>
//       </div>

//       <div className="systems-table-container">
//         <table className="systems-table">
//           <thead>
//             <tr>
//               <th>System</th>
//               <th>Type</th>
//               <th>Status</th>
//               <th>Criticality</th>
//               <th>Last Approved</th>
//               <th>Approved By</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {paginatedSystems.length === 0 ? (
//               <tr>
//                 <td colSpan="7" className="no-systems-message">
//                   No systems found matching your filters
//                 </td>
//               </tr>
//             ) : (
//               paginatedSystems.map((system) => (
//                 <tr key={system.id}>
//                   <td>{system.name}</td>
//                   <td>{getSystemTypeTag(system)}</td>
//                   <td>
//                     <span className={`status-badge ${getStatus(system).toLowerCase()}`}>
//                       {getStatus(system)}
//                     </span>
//                   </td>
//                   <td>{getCriticalityTag(system)}</td>
//                   <td>
//                     {formatDateTime(system.approved_at)}
//                   </td>
//                   <td>{system.approved_by || "--"}</td>
//                   <td className="actions-cell">
//                     <button 
//                       onClick={() => setSelectedSystem(system)}
//                       className="view-button"
//                     >
//                       👁️ View
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {filteredSystems.length > systemsPerPage && (
//         <div className="pagination">
//           <button
//             onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
//             disabled={currentPage === 1}
//           >
//             Previous
//           </button>
          
//           {Array.from(
//             { length: Math.ceil(filteredSystems.length / systemsPerPage) },
//             (_, i) => (
//               <button
//                 key={i + 1}
//                 onClick={() => setCurrentPage(i + 1)}
//                 className={currentPage === i + 1 ? "active-page" : ""}
//               >
//                 {i + 1}
//               </button>
//             )
//           )}
          
//           <button
//             onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredSystems.length / systemsPerPage)))}
//             disabled={currentPage === Math.ceil(filteredSystems.length / systemsPerPage)}
//           >
//             Next
//           </button>
//         </div>
//       )}

//       {selectedSystem && (
//         <Modal
//           title={`System: ${selectedSystem.name}`}
//           onClose={() => setSelectedSystem(null)}
//         >
//           <SystemDetail
//             system={selectedSystem}
//             user={user}
//             isViewer={true}
//             onClose={() => setSelectedSystem(null)}
//           />
//         </Modal>
//       )}
//     </div>
//   );
// }

// export default ViewerDashboard;
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import Modal from "./Modal";
import SystemDetail from "./SystemDetail";
import RequestApproval from "./RequestApproval";
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
      {/* Header Row */}
      <div className="dashboard-header">
        <h1>📊 Viewer Dashboard</h1>
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
                    <span className={`status-badge ${getStatus(system).toLowerCase()}`}>
                      {getStatus(system)}
                    </span>
                  </td>
                  <td>{getCriticalityTag(system)}</td>
                  <td>
                    {formatDateTime(system.approved_at)}
                  </td>
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
              fetchSystems(); // Refresh the list after submission
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default ViewerDashboard;