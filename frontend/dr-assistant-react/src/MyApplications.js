// import React, { useState, useEffect } from 'react';
// import { useAuth } from './AuthContext';
// import ReactMarkdown from 'react-markdown';
// import DependencyInput from './DependencyInput';
// import './MyApplications.css';

// function MyApplications({ setView }) {
//   const { user, token } = useAuth();
//   const [applications, setApplications] = useState([]);
//   const [expandedAppId, setExpandedAppId] = useState(null);
//   const [systemsMap, setSystemsMap] = useState({});
//   const [selectedSystemId, setSelectedSystemId] = useState(null);
//   const [editedData, setEditedData] = useState({});
//   const [editMode, setEditMode] = useState(false);
//   const [dependencySuggestions, setDependencySuggestions] = useState([]);
//   const [showCreateExternalModal, setShowCreateExternalModal] = useState(false);
//   const [newExternalSystem, setNewExternalSystem] = useState({
//     name: "",
//     dr_data: "",
//     system_type: "external",
//     upstream_dependencies: [],
//     downstream_dependencies: [],
//     key_contacts: []
//   });
//   const [loading, setLoading] = useState({
//     applications: false,
//     systems: false
//   });
//   const [error, setError] = useState({
//     applications: null,
//     systems: null
//   });

//   // Helper function to get proper application display name
//   const getApplicationName = (app) => {
//     if (app.name && app.name.trim() !== "") {
//       return app.name;
//     }
    
//     // Try to get name from first runbook filename
//     if (app.runbooks?.length > 0 && app.runbooks[0].filename) {
//       const filename = app.runbooks[0].filename;
//       // Remove file extension
//       return filename.replace(/\.[^/.]+$/, "");
//     }
    
//     return "Unnamed Application";
//   };

//   const handleSystemClick = (system) => {
//     setSelectedSystemId(system.id);
//     setEditedData({
//       dr_data: system.dr_data || "",
//       upstream_dependencies: system.upstream_dependencies?.map(d => ({ id: d, text: d })) || [],
//       downstream_dependencies: system.downstream_dependencies?.map(d => ({ id: d, text: d })) || [],
//       key_contacts: system.key_contacts?.join(", ") || "",
//       source_reference: system.source_reference || "",
//       system_type: system.system_type || "internal",
//       is_approved: system.is_approved || false,
//       approved_by: system.approved_by || null,
//       approved_at: system.approved_at || null
//     });
//     setEditMode(false);
//   };

//   const handleSave = async () => {
//     if (!editedData.dr_data.trim()) {
//       alert("DR Data cannot be empty.");
//       return;
//     }

//     const confirmEdit = window.confirm("Are you sure you want to save the changes?");
//     if (!confirmEdit) return;

//     try {
//       const url = user.role === "admin"
//         ? `http://localhost:8000/api/v1/admin/systems/${selectedSystemId}/update`
//         : `http://localhost:8000/api/v1/validation/systems/${selectedSystemId}/update`;

//       const payload = {
//         dr_data: editedData.dr_data,
//         system_type: editedData.system_type,
//         source_reference: editedData.source_reference || null,
//         upstream_dependencies: editedData.upstream_dependencies.map(tag => tag.text),
//         downstream_dependencies: editedData.downstream_dependencies.map(tag => tag.text),
//         key_contacts: editedData.key_contacts
//           .split(",")
//           .map(d => d.trim())
//           .filter(Boolean),
//         force_external: true
//       };

//       const res = await fetch(url, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (res.ok) {
//         const updated = await res.json();
//         alert("System updated successfully!");
//         setEditMode(false);
//         fetchSystems(expandedAppId);
//       } else {
//         const errorData = await res.json();
//         throw new Error(errorData.detail || 'Update failed');
//       }
//     } catch (err) {
//       console.error("Update error:", err);
//       alert(`Error: ${err.message}`);
//     }
//   };

//   const handleApprove = async (systemId) => {
//     if (!window.confirm("Approve or Re-Approve this system?")) return;

//     try {
//       const res = await fetch(
//         `http://localhost:8000/api/v1/validation/systems/${systemId}/approve`,
//         {
//           method: "PATCH",
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
      
//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.detail || 'Approval failed');
//       }
      
//       alert("Approved successfully!");
//       fetchSystems(expandedAppId);
//     } catch (err) {
//       console.error("Approval error:", err);
//       alert(`Error: ${err.message}`);
//     }
//   };

//   const createExternalSystem = async () => {
//     const confirm = window.confirm(
//       `Are you sure you want to create an external system named "${newExternalSystem.name}"?`
//     );
//     if (!confirm) return;

//     try {
//       if (!newExternalSystem.name.trim()) {
//         throw new Error("System name cannot be empty");
//       }

//       if (!expandedAppId) {
//         throw new Error("No application selected");
//       }

//       const response = await fetch(
//         `http://localhost:8000/api/v1/validation/applications/${expandedAppId}/systems/external`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             name: newExternalSystem.name,
//             system_type: newExternalSystem.system_type,
//             dr_data: newExternalSystem.dr_data || `Manually created external system: ${newExternalSystem.name}`,
//             upstream_dependencies: newExternalSystem.upstream_dependencies,
//             downstream_dependencies: newExternalSystem.downstream_dependencies,
//             key_contacts: newExternalSystem.key_contacts,
//             source_reference: "Manually created via application view"
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to create external system");
//       }

//       const createdSystem = await response.json();
//       alert(`External system "${createdSystem.name}" created successfully!`);
//       setShowCreateExternalModal(false);
//       setNewExternalSystem({
//         name: "",
//         dr_data: "",
//         system_type: "external",
//         upstream_dependencies: [],
//         downstream_dependencies: [],
//         key_contacts: []
//       });
//       fetchSystems(expandedAppId);
//     } catch (error) {
//       console.error("Error creating external system:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const fetchApplications = async () => {
//     try {
//       setLoading(prev => ({ ...prev, applications: true }));
//       setError(prev => ({ ...prev, applications: null }));
      
//       const url = user.role === "admin"
//         ? "http://localhost:8000/api/v1/admin/applications"
//         : "http://localhost:8000/api/v1/validation/applications";

//       const response = await fetch(url, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || 'Failed to fetch applications');
//       }

//       const data = await response.json();
//       setApplications(data);
//     } catch (err) {
//       console.error("Error fetching applications:", err);
//       setError(prev => ({ ...prev, applications: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, applications: false }));
//     }
//   };

//   const fetchSystems = async (appId) => {
//     try {
//       setLoading(prev => ({ ...prev, systems: true }));
//       setError(prev => ({ ...prev, systems: null }));
      
//       const url = user.role === "admin"
//         ? `http://localhost:8000/api/v1/admin/applications/${appId}/systems`
//         : `http://localhost:8000/api/v1/validation/applications/${appId}/systems`;

//       const response = await fetch(url, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || 'Failed to fetch systems');
//       }

//       const data = await response.json();
//       setSystemsMap(prev => ({ ...prev, [appId]: data }));
      
//       // Update dependency suggestions
//       const allSystemNames = data.map(sys => ({
//         id: sys.name,
//         text: sys.name
//       }));
//       setDependencySuggestions(allSystemNames);
//     } catch (err) {
//       console.error("Error fetching systems:", err);
//       setError(prev => ({ ...prev, systems: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, systems: false }));
//     }
//   };

//   const handleExpand = (appId) => {
//     if (expandedAppId === appId) {
//       setExpandedAppId(null);
//       setSelectedSystemId(null);
//     } else {
//       setExpandedAppId(appId);
//       fetchSystems(appId);
//       setSelectedSystemId(null);
//     }
//   };

//   useEffect(() => {
//     fetchApplications();
//   }, [user, token]);

//   if (loading.applications) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading applications...</p>
//       </div>
//     );
//   }

//   if (error.applications) {
//     return (
//       <div className="error-container">
//         <div className="error-message">
//           <p>Error loading applications: {error.applications}</p>
//           <button onClick={fetchApplications}>Retry</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="my-applications">
//       <h2>📂 All Applications</h2>
//       <div className="applications-layout">
//         {/* Left Panel: Application List */}
//         <div className="left-panel">
//           {applications.length === 0 ? (
//             <div className="empty-state">
//               <p>No applications found</p>
//               <button onClick={() => setView('upload')}>
//                 Upload New Application
//               </button>
//             </div>
//           ) : (
//             applications.map((app) => (
//               <div key={app.id} className="application-block">
//                 <div 
//                   className={`app-header ${expandedAppId === app.id ? 'active' : ''}`}
//                   onClick={() => handleExpand(app.id)}
//                 >
//                   <strong>{getApplicationName(app)}</strong> - 
//                   {/* Created by {app.user_name || 'Unknown'} -  */}
//                   {new Date(app.started_at).toLocaleDateString()} 
//                   {expandedAppId === app.id ? ' ▼' : ' ▶'}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Middle Panel: Systems */}
//         <div className="middle-panel">
//           {!expandedAppId ? (
//             <div className="placeholder-panel">
//               <div className="placeholder-content">
//                 <div className="placeholder-icon">📄</div>
//                 <p>Select an application to view systems</p>
//               </div>
//             </div>
//           ) : loading.systems ? (
//             <div className="loading-panel">
//               <div className="loading-spinner"></div>
//               <p>Loading systems...</p>
//             </div>
//           ) : error.systems ? (
//             <div className="error-panel">
//               <p>Error loading systems: {error.systems}</p>
//               <button onClick={() => fetchSystems(expandedAppId)}>Retry</button>
//             </div>
//           ) : (
//             <>
//               <div className="panel-header">
//                 <h3>Systems</h3>
//                 <div className="system-actions">
//                   <button
//                     className="view-graph-button"
//                     onClick={() => setView('analysis', expandedAppId)}
//                   >
//                     View Dependency Graph 📈
//                   </button>
//                   <button
//                     className="create-external-button"
//                     onClick={() => setShowCreateExternalModal(true)}
//                   >
//                     ➕ Add External System
//                   </button>
//                 </div>
//               </div>
//               <div className="systems-list">
//                 {systemsMap[expandedAppId]?.length > 0 ? (
//                   systemsMap[expandedAppId].map((sys) => (
//                     <div
//                       key={sys.id}
//                       className={`system-card ${selectedSystemId === sys.id ? 'selected' : ''}`}
//                       onClick={() => handleSystemClick(sys)}
//                     >
//                       <strong>{sys.name}</strong>
//                       <div className="system-status">
//                         {sys.is_approved ? (
//                           <span className="approved">
//                             ✅ {sys.approved_by} - {new Date(sys.approved_at).toLocaleString()}
//                           </span>
//                         ) : (
//                           <span className="pending">❌ Pending Approval</span>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div className="empty-systems">
//                     <p>No systems found for this application</p>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}
//         </div>

//         {/* Right Panel: System Details */}
//         <div className="right-panel">
//           {!selectedSystemId ? (
//             <div className="placeholder-panel">
//               <div className="placeholder-content">
//                 <div className="placeholder-icon">🔍</div>
//                 <p>Select a system to view details</p>
//               </div>
//             </div>
//           ) : (
//             <div className="system-detail-panel">
//               <h3>System Details</h3>
//               {editMode ? (
//                 <div className="edit-form">
//                   <div className="form-group">
//                     <label>DR Data</label>
//                     <textarea
//                       rows="6"
//                       value={editedData.dr_data}
//                       onChange={(e) =>
//                         setEditedData({ ...editedData, dr_data: e.target.value })
//                       }
//                     />
//                   </div>
                  
//                   <div className="form-group">
//                     <label>System Type</label>
//                     <select
//                       value={editedData.system_type}
//                       onChange={(e) =>
//                         setEditedData({ ...editedData, system_type: e.target.value })
//                       }
//                     >
//                       <option value="internal">Internal</option>
//                       <option value="external">External</option>
//                       <option value="unclassified">Unclassified</option>
//                     </select>
//                   </div>

//                   <div className="form-group">
//                     <label>Upstream Dependencies</label>
//                     <DependencyInput
//                       tags={editedData.upstream_dependencies || []}
//                       setTags={(newTags) => 
//                         setEditedData({ ...editedData, upstream_dependencies: newTags })
//                       }
//                       suggestions={dependencySuggestions}
//                     />
//                   </div>

//                   <div className="form-group">
//                     <label>Downstream Dependencies</label>
//                     <DependencyInput
//                       tags={editedData.downstream_dependencies || []}
//                       setTags={(newTags) => 
//                         setEditedData({ ...editedData, downstream_dependencies: newTags })
//                       }
//                       suggestions={dependencySuggestions}
//                     />
//                   </div>

//                   <div className="form-group">
//                     <label>Key Contacts (comma-separated)</label>
//                     <input
//                       value={editedData.key_contacts}
//                       onChange={(e) =>
//                         setEditedData({
//                           ...editedData,
//                           key_contacts: e.target.value,
//                         })
//                       }
//                     />
//                   </div>

//                   <div className="form-group">
//                     <label>Source Reference</label>
//                     <input
//                       value={editedData.source_reference}
//                       onChange={(e) =>
//                         setEditedData({
//                           ...editedData,
//                           source_reference: e.target.value,
//                         })
//                       }
//                     />
//                   </div>

//                   <div className="form-actions">
//                     <button className="save-button" onClick={handleSave}>
//                       💾 Save
//                     </button>
//                     <button className="cancel-button" onClick={() => setEditMode(false)}>
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="view-mode">
//                   <div className="dr-data">
//                     <ReactMarkdown>{editedData.dr_data}</ReactMarkdown>
//                   </div>
                  
//                   <div className="system-meta">
//                     <p><strong>System Type:</strong> {editedData.system_type || "internal"}</p>
                    
//                     <div className="dependencies">
//                       <p><strong>Upstream Dependencies:</strong></p>
//                       <div className="dependency-tags-display">
//                         {editedData.upstream_dependencies?.length > 0 ? (
//                           editedData.upstream_dependencies.map(tag => (
//                             <span 
//                               key={tag.id} 
//                               className={`tag-display ${!dependencySuggestions.some(s => s.id === tag.id) ? 'external' : ''}`}
//                             >
//                               {tag.text}
//                             </span>
//                           ))
//                         ) : (
//                           <span className="no-dependencies">None</span>
//                         )}
//                       </div>
//                     </div>

//                     <div className="dependencies">
//                       <p><strong>Downstream Dependencies:</strong></p>
//                       <div className="dependency-tags-display">
//                         {editedData.downstream_dependencies?.length > 0 ? (
//                           editedData.downstream_dependencies.map(tag => (
//                             <span 
//                               key={tag.id} 
//                               className={`tag-display ${!dependencySuggestions.some(s => s.id === tag.id) ? 'external' : ''}`}
//                             >
//                               {tag.text}
//                             </span>
//                           ))
//                         ) : (
//                           <span className="no-dependencies">None</span>
//                         )}
//                       </div>
//                     </div>

//                     <p><strong>Key Contacts:</strong> {editedData.key_contacts || "None"}</p>
//                     <p><strong>Source Reference:</strong> {editedData.source_reference || "None"}</p>

//                     {editedData.is_approved && (
//                       <div className="approval-info">
//                         <p>
//                           ✅ <strong>Approved by:</strong> {editedData.approved_by}
//                         </p>
//                         <p>
//                           <strong>Approved at:</strong> {new Date(editedData.approved_at).toLocaleString()}
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   <div className="action-buttons">
//                     <button className="edit-button" onClick={() => setEditMode(true)}>
//                       ✏️ Edit
//                     </button>
//                     <button 
//                       className={`approve-button ${editedData.is_approved ? 'reapprove' : ''}`}
//                       onClick={() => handleApprove(selectedSystemId)}
//                     >
//                       ✅ {editedData.is_approved ? "Re-Approve" : "Approve"}
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Create External System Modal */}
//       {showCreateExternalModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h3>Create External System</h3>
//               <button 
//                 className="modal-close"
//                 onClick={() => setShowCreateExternalModal(false)}
//               >
//                 ×
//               </button>
//             </div>
//             <div className="modal-body">
//               <div className="form-group">
//                 <label>System Name</label>
//                 <input
//                   type="text"
//                   value={newExternalSystem.name}
//                   onChange={(e) => setNewExternalSystem({
//                     ...newExternalSystem,
//                     name: e.target.value
//                   })}
//                   placeholder="Enter system name"
//                 />
//               </div>

//               <div className="form-group">
//                 <label>DR Data</label>
//                 <textarea
//                   value={newExternalSystem.dr_data}
//                   onChange={(e) => setNewExternalSystem({
//                     ...newExternalSystem,
//                     dr_data: e.target.value
//                   })}
//                   placeholder="Enter DR data description"
//                   rows={4}
//                 />
//               </div>

//               <div className="form-group">
//                 <label>System Type</label>
//                 <select
//                   value={newExternalSystem.system_type}
//                   onChange={(e) => setNewExternalSystem({
//                     ...newExternalSystem,
//                     system_type: e.target.value
//                   })}
//                 >
//                   <option value="external">External</option>
//                   <option value="internal">Internal</option>
//                   <option value="unclassified">Unclassified</option>
//                 </select>
//               </div>

//               <div className="form-actions">
//                 <button
//                   className="btn-cancel"
//                   onClick={() => setShowCreateExternalModal(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="btn-submit"
//                   onClick={createExternalSystem}
//                 >
//                   Create System
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default MyApplications;
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import ReactMarkdown from 'react-markdown';
import DependencyInput from './DependencyInput';
import './MyApplications.css';

function MyApplications({ setView }) {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [systemsMap, setSystemsMap] = useState({});
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [dependencySuggestions, setDependencySuggestions] = useState([]);
  const [showCreateExternalModal, setShowCreateExternalModal] = useState(false);
  const [newExternalSystem, setNewExternalSystem] = useState({
    name: "",
    dr_data: "",
    system_type: "external",
    upstream_dependencies: [],
    downstream_dependencies: [],
    key_contacts: []
  });
  const [loading, setLoading] = useState({
    applications: false,
    systems: false
  });
  const [error, setError] = useState({
    applications: null,
    systems: null
  });

  const getApplicationName = (app) => {
    if (app.name && app.name.trim() !== "") {
      return app.name;
    }
    
    if (app.runbooks?.length > 0 && app.runbooks[0].filename) {
      const filename = app.runbooks[0].filename;
      return filename.replace(/\.[^/.]+$/, "");
    }
    
    return "Unnamed Application";
  };

  const handleSystemClick = (system) => {
    setSelectedSystemId(system.id);
    setEditedData({
      dr_data: system.dr_data || "",
      upstream_dependencies: system.upstream_dependencies?.map(d => ({ id: d, text: d })) || [],
      downstream_dependencies: system.downstream_dependencies?.map(d => ({ id: d, text: d })) || [],
      key_contacts: system.key_contacts?.join(", ") || "",
      source_reference: system.source_reference || "",
      system_type: system.system_type || "internal",
      is_approved: system.is_approved || false,
      approved_by: system.approved_by || null,
      approved_at: system.approved_at || null
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!editedData.dr_data.trim()) {
      alert("DR Data cannot be empty.");
      return;
    }

    const confirmEdit = window.confirm("Are you sure you want to save the changes?");
    if (!confirmEdit) return;

    try {
      const url = user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/systems/${selectedSystemId}/update`
        : `http://localhost:8000/api/v1/validation/systems/${selectedSystemId}/update`;

      const payload = {
        dr_data: editedData.dr_data,
        system_type: editedData.system_type,
        source_reference: editedData.source_reference || null,
        upstream_dependencies: editedData.upstream_dependencies.map(tag => tag.text),
        downstream_dependencies: editedData.downstream_dependencies.map(tag => tag.text),
        key_contacts: editedData.key_contacts
          .split(",")
          .map(d => d.trim())
          .filter(Boolean),
        force_external: true
      };

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        alert("System updated successfully!");
        setEditMode(false);
        fetchSystems(expandedAppId);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Update failed');
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleApprove = async (systemId) => {
    if (!window.confirm("Approve or Re-Approve this system?")) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/validation/systems/${systemId}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Approval failed');
      }
      
      alert("Approved successfully!");
      fetchSystems(expandedAppId);
    } catch (err) {
      console.error("Approval error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const createExternalSystem = async () => {
    const confirm = window.confirm(
      `Are you sure you want to create an external system named "${newExternalSystem.name}"?`
    );
    if (!confirm) return;

    try {
      if (!newExternalSystem.name.trim()) {
        throw new Error("System name cannot be empty");
      }

      if (!expandedAppId) {
        throw new Error("No application selected");
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/validation/applications/${expandedAppId}/systems/external`,
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
            source_reference: "Manually created via application view"
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
        dr_data: "",
        system_type: "external",
        upstream_dependencies: [],
        downstream_dependencies: [],
        key_contacts: []
      });
      fetchSystems(expandedAppId);
    } catch (error) {
      console.error("Error creating external system:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(prev => ({ ...prev, applications: true }));
      setError(prev => ({ ...prev, applications: null }));
      
      const url = user.role === "admin"
        ? "http://localhost:8000/api/v1/admin/applications"
        : "http://localhost:8000/api/v1/validation/applications";

      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(prev => ({ ...prev, applications: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  };

  const fetchSystems = async (appId) => {
    try {
      setLoading(prev => ({ ...prev, systems: true }));
      setError(prev => ({ ...prev, systems: null }));
      
      const url = user.role === "admin"
        ? `http://localhost:8000/api/v1/admin/applications/${appId}/systems`
        : `http://localhost:8000/api/v1/validation/applications/${appId}/systems`;

      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch systems');
      }

      const data = await response.json();
      setSystemsMap(prev => ({ ...prev, [appId]: data }));
      
      const allSystemNames = data.map(sys => ({
        id: sys.name,
        text: sys.name
      }));
      setDependencySuggestions(allSystemNames);
    } catch (err) {
      console.error("Error fetching systems:", err);
      setError(prev => ({ ...prev, systems: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, systems: false }));
    }
  };

  const handleExpand = (appId) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
      setSelectedSystemId(null);
    } else {
      setExpandedAppId(appId);
      fetchSystems(appId);
      setSelectedSystemId(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user, token]);

  if (loading.applications) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  if (error.applications) {
    return (
      <div className="error-container">
        <div className="error-message">
          <p>Error loading applications: {error.applications}</p>
          <button onClick={fetchApplications}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-applications">
      <h2>📂 All Applications</h2>
      <div className="applications-layout">
        {/* Left Panel: Application List */}
        <div className="left-panel">
          {applications.length === 0 ? (
            <div className="empty-state">
              <p>No applications found</p>
              <button onClick={() => setView('upload')}>
                Upload New Application
              </button>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="application-block">
                <div 
                  className={`app-header ${expandedAppId === app.id ? 'active' : ''}`}
                  onClick={() => handleExpand(app.id)}
                >
                  <strong>{getApplicationName(app)}</strong> - 
                  {new Date(app.started_at).toLocaleDateString()} 
                  {expandedAppId === app.id ? ' ▼' : ' ▶'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Middle Panel: Systems */}
        <div className="middle-panel">
          {!expandedAppId ? (
            <div className="placeholder-panel">
              <div className="placeholder-content">
                <div className="placeholder-icon">📄</div>
                <p>Select an application to view systems</p>
              </div>
            </div>
          ) : loading.systems ? (
            <div className="loading-panel">
              <div className="loading-spinner"></div>
              <p>Loading systems...</p>
            </div>
          ) : error.systems ? (
            <div className="error-panel">
              <p>Error loading systems: {error.systems}</p>
              <button onClick={() => fetchSystems(expandedAppId)}>Retry</button>
            </div>
          ) : (
            <>
              <div className="panel-header">
                <h3>Systems</h3>
                <div className="system-actions">
                  <button
                    className="view-graph-button"
                    onClick={() => setView('analysis', expandedAppId)}
                  >
                    View Dependency Graph 📈
                  </button>
                  <button
                    className="create-external-button"
                    onClick={() => setShowCreateExternalModal(true)}
                  >
                    ➕ Add External System
                  </button>
                </div>
              </div>
              <div className="systems-list">
                {systemsMap[expandedAppId]?.length > 0 ? (
                  systemsMap[expandedAppId].map((sys) => (
                    <div
                      key={sys.id}
                      className={`system-card ${selectedSystemId === sys.id ? 'selected' : ''}`}
                      onClick={() => handleSystemClick(sys)}
                    >
                      <div className="system-card-header">
                        <strong>{sys.name}</strong>
                        <div className={`system-type-badge ${sys.system_type}`}>
                          {sys.system_type}
                        </div>
                      </div>
                      <div className="system-status">
                        {sys.is_approved ? (
                          <div className="approval-status approved">
                            <div className="approval-badge">
                              <span className="badge-icon">✓</span>
                              Approved
                            </div>
                            <div className="approval-details">
                              <span>by {sys.approved_by}</span>
                              <span>{new Date(sys.approved_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="approval-status pending">
                            <div className="approval-badge">
                              <span className="badge-icon">✗</span>
                              Pending Approval
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-systems">
                    <p>No systems found for this application</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel: System Details */}
        <div className="right-panel">
          {!selectedSystemId ? (
            <div className="placeholder-panel">
              <div className="placeholder-content">
                <div className="placeholder-icon">🔍</div>
                <p>Select a system to view details</p>
              </div>
            </div>
          ) : (
            <div className="system-detail-panel">
              <h3>System Details</h3>
              {editMode ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>DR Data</label>
                    <textarea
                      rows="6"
                      value={editedData.dr_data}
                      onChange={(e) =>
                        setEditedData({ ...editedData, dr_data: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>System Type</label>
                    <select
                      value={editedData.system_type}
                      onChange={(e) =>
                        setEditedData({ ...editedData, system_type: e.target.value })
                      }
                    >
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                      <option value="unclassified">Unclassified</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Upstream Dependencies</label>
                    <DependencyInput
                      tags={editedData.upstream_dependencies || []}
                      setTags={(newTags) => 
                        setEditedData({ ...editedData, upstream_dependencies: newTags })
                      }
                      suggestions={dependencySuggestions}
                    />
                  </div>

                  <div className="form-group">
                    <label>Downstream Dependencies</label>
                    <DependencyInput
                      tags={editedData.downstream_dependencies || []}
                      setTags={(newTags) => 
                        setEditedData({ ...editedData, downstream_dependencies: newTags })
                      }
                      suggestions={dependencySuggestions}
                    />
                  </div>

                  <div className="form-group">
                    <label>Key Contacts (comma-separated)</label>
                    <input
                      value={editedData.key_contacts}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          key_contacts: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Source Reference</label>
                    <input
                      value={editedData.source_reference}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          source_reference: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-actions">
                    <button className="save-button" onClick={handleSave}>
                      💾 Save
                    </button>
                    <button className="cancel-button" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="view-mode">
                  <div className="system-meta-header">
                    <div className={`system-type-badge large ${editedData.system_type}`}>
                      {editedData.system_type}
                    </div>
                    {editedData.is_approved && (
                      <div className="approval-status approved large">
                        <div className="approval-badge">
                          <span className="badge-icon">✓</span>
                          Approved
                        </div>
                        <div className="approval-details">
                          <span>by {editedData.approved_by}</span>
                          <span>{new Date(editedData.approved_at).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="dr-data">
                    <ReactMarkdown>{editedData.dr_data}</ReactMarkdown>
                  </div>
                  
                  <div className="system-meta">
                    <div className="dependencies">
                      <p><strong>Upstream Dependencies:</strong></p>
                      <div className="dependency-tags-display">
                        {editedData.upstream_dependencies?.length > 0 ? (
                          editedData.upstream_dependencies.map(tag => (
                            <span 
                              key={tag.id} 
                              className={`tag-display ${!dependencySuggestions.some(s => s.id === tag.id) ? 'external' : ''}`}
                            >
                              {tag.text}
                            </span>
                          ))
                        ) : (
                          <span className="no-dependencies">None</span>
                        )}
                      </div>
                    </div>

                    <div className="dependencies">
                      <p><strong>Downstream Dependencies:</strong></p>
                      <div className="dependency-tags-display">
                        {editedData.downstream_dependencies?.length > 0 ? (
                          editedData.downstream_dependencies.map(tag => (
                            <span 
                              key={tag.id} 
                              className={`tag-display ${!dependencySuggestions.some(s => s.id === tag.id) ? 'external' : ''}`}
                            >
                              {tag.text}
                            </span>
                          ))
                        ) : (
                          <span className="no-dependencies">None</span>
                        )}
                      </div>
                    </div>

                    <p><strong>Key Contacts:</strong> {editedData.key_contacts || "None"}</p>
                    <p><strong>Source Reference:</strong> {editedData.source_reference || "None"}</p>
                  </div>

                  <div className="action-buttons">
                    <button className="edit-button" onClick={() => setEditMode(true)}>
                      ✏️ Edit
                    </button>
                    <button 
                      className={`approve-button ${editedData.is_approved ? 'reapprove' : ''}`}
                      onClick={() => handleApprove(selectedSystemId)}
                    >
                      {editedData.is_approved ? "Re-Approve" : "Approve"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create External System Modal */}
      {showCreateExternalModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create External System</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateExternalModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>System Name</label>
                <input
                  type="text"
                  value={newExternalSystem.name}
                  onChange={(e) => setNewExternalSystem({
                    ...newExternalSystem,
                    name: e.target.value
                  })}
                  placeholder="Enter system name"
                />
              </div>

              <div className="form-group">
                <label>DR Data</label>
                <textarea
                  value={newExternalSystem.dr_data}
                  onChange={(e) => setNewExternalSystem({
                    ...newExternalSystem,
                    dr_data: e.target.value
                  })}
                  placeholder="Enter DR data description"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>System Type</label>
                <select
                  value={newExternalSystem.system_type}
                  onChange={(e) => setNewExternalSystem({
                    ...newExternalSystem,
                    system_type: e.target.value
                  })}
                >
                  <option value="external">External</option>
                  <option value="internal">Internal</option>
                  <option value="unclassified">Unclassified</option>
                </select>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default MyApplications;