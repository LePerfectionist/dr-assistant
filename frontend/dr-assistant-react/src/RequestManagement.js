// // // // import React, { useEffect, useState } from 'react';
// // // // import { useAuth } from './AuthContext';
// // // // import './RequestManagement.css';

// // // // function RequestManagement() {
// // // //   const { user, token } = useAuth();
// // // //   const [requests, setRequests] = useState([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [selectedRequest, setSelectedRequest] = useState(null);
// // // //   const [decision, setDecision] = useState('');
// // // //   const [comment, setComment] = useState('');

// // // //   useEffect(() => {
// // // //     const fetchRequests = async () => {
// // // //       try {
// // // //         const response = await fetch('http://localhost:8000/api/v1/requests/pending', {
// // // //           headers: {
// // // //             Authorization: `Bearer ${token}`,
// // // //           },
// // // //         });
// // // //         const data = await response.json();
// // // //         setRequests(data);
// // // //       } catch (error) {
// // // //         console.error('Error fetching requests:', error);
// // // //       } finally {
// // // //         setLoading(false);
// // // //       }
// // // //     };

// // // //     fetchRequests();
// // // //   }, [token]);

// // // //   const handleApproveReject = async () => {
// // // //     if (!decision || !selectedRequest) return;

// // // //     try {
// // // //       const response = await fetch(
// // // //         `http://localhost:8000/api/v1/requests/${selectedRequest.id}/${decision}`,
// // // //         {
// // // //           method: 'PATCH',
// // // //           headers: {
// // // //             'Content-Type': 'application/json',
// // // //             Authorization: `Bearer ${token}`,
// // // //           },
// // // //           body: JSON.stringify({ comment }),
// // // //         }
// // // //       );

// // // //       if (!response.ok) {
// // // //         throw new Error('Failed to update request');
// // // //       }

// // // //       // Refresh the requests list
// // // //       const updatedRequests = requests.filter(
// // // //         (req) => req.id !== selectedRequest.id
// // // //       );
// // // //       setRequests(updatedRequests);
// // // //       setSelectedRequest(null);
// // // //       alert(`Request ${decision}d successfully!`);
// // // //     } catch (error) {
// // // //       console.error('Error updating request:', error);
// // // //       alert(`Error: ${error.message}`);
// // // //     }
// // // //   };

// // // //   if (loading) {
// // // //     return <div className="loading">Loading requests...</div>;
// // // //   }

// // // //   return (
// // // //     <div className="request-management">
// // // //       <h2>Pending Approval Requests</h2>
      
// // // //       {requests.length === 0 ? (
// // // //         <p className="no-requests">No pending requests found</p>
// // // //       ) : (
// // // //         <div className="requests-list">
// // // //           {requests.map((request) => (
// // // //             <div 
// // // //               key={request.id} 
// // // //               className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
// // // //               onClick={() => setSelectedRequest(request)}
// // // //             >
// // // //               <h3>System: {request.system.name}</h3>
// // // //               <p>Requested by: {request.requested_by_user.name}</p>
// // // //               <p>Date: {new Date(request.created_at).toLocaleString()}</p>
// // // //               <p>Reason: {request.reason}</p>
// // // //               <p className={`status ${request.status}`}>{request.status}</p>
// // // //             </div>
// // // //           ))}
// // // //         </div>
// // // //       )}

// // // //       {selectedRequest && (
// // // //         <div className="decision-panel">
// // // //           <h3>Review Request</h3>
// // // //           <div className="form-group">
// // // //             <label>Decision:</label>
// // // //             <div className="decision-options">
// // // //               <button
// // // //                 className={`decision-btn approve ${decision === 'approve' ? 'active' : ''}`}
// // // //                 onClick={() => setDecision('approve')}
// // // //               >
// // // //                 Approve
// // // //               </button>
// // // //               <button
// // // //                 className={`decision-btn reject ${decision === 'reject' ? 'active' : ''}`}
// // // //                 onClick={() => setDecision('reject')}
// // // //               >
// // // //                 Reject
// // // //               </button>
// // // //             </div>
// // // //           </div>
          
// // // //           <div className="form-group">
// // // //             <label>Comments:</label>
// // // //             <textarea
// // // //               value={comment}
// // // //               onChange={(e) => setComment(e.target.value)}
// // // //               rows={3}
// // // //               placeholder="Add any comments (optional)"
// // // //             />
// // // //           </div>
          
// // // //           <div className="action-buttons">
// // // //             <button
// // // //               className="submit-btn"
// // // //               onClick={handleApproveReject}
// // // //               disabled={!decision}
// // // //             >
// // // //               Submit Decision
// // // //             </button>
// // // //             <button
// // // //               className="cancel-btn"
// // // //               onClick={() => {
// // // //                 setSelectedRequest(null);
// // // //                 setDecision('');
// // // //                 setComment('');
// // // //               }}
// // // //             >
// // // //               Cancel
// // // //             </button>
// // // //           </div>
// // // //         </div>
// // // //       )}
// // // //     </div>
// // // //   );
// // // // }

// // // // export default RequestManagement;
// // // import React, { useEffect, useState } from 'react';
// // // import { useAuth } from './AuthContext';
// // // import './RequestManagement.css';

// // // function RequestManagement() {
// // //   const { user, token } = useAuth();
// // //   const [requests, setRequests] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [selectedRequest, setSelectedRequest] = useState(null);
// // //   const [decision, setDecision] = useState('');
// // //   const [comment, setComment] = useState('');
// // //   const [page, setPage] = useState(1);
// // //   const [totalPages, setTotalPages] = useState(1);
// // //   const [searchTerm, setSearchTerm] = useState('');

// // //   const fetchRequests = async () => {
// // //     try {
// // //       setLoading(true);
// // //       const response = await fetch(
// // //         `http://localhost:8000/api/v1/requests/pending?page=${page}&search=${searchTerm}`,
// // //         {
// // //           headers: {
// // //             Authorization: `Bearer ${token}`,
// // //           },
// // //         }
// // //       );
      
// // //       if (!response.ok) {
// // //         throw new Error('Failed to fetch requests');
// // //       }

// // //       const data = await response.json();
// // //       setRequests(data.items || []);
// // //       setTotalPages(data.total_pages || 1);
// // //     } catch (error) {
// // //       console.error('Error fetching requests:', error);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     fetchRequests();
// // //   }, [token, page, searchTerm]);

// // //   const handleSearch = (e) => {
// // //     setSearchTerm(e.target.value);
// // //     setPage(1); // Reset to first page when searching
// // //   };

// // //   const handleApproveReject = async () => {
// // //     if (!decision || !selectedRequest) return;

// // //     const confirmAction = window.confirm(
// // //       `Are you sure you want to ${decision} this request?`
// // //     );
// // //     if (!confirmAction) return;

// // //     try {
// // //       const response = await fetch(
// // //         `http://localhost:8000/api/v1/requests/${selectedRequest.id}/${decision}`,
// // //         {
// // //           method: 'PATCH',
// // //           headers: {
// // //             'Content-Type': 'application/json',
// // //             Authorization: `Bearer ${token}`,
// // //           },
// // //           body: JSON.stringify({ comment }),
// // //         }
// // //       );

// // //       if (!response.ok) {
// // //         throw new Error('Failed to update request');
// // //       }

// // //       // Refresh the requests list
// // //       fetchRequests();
// // //       setSelectedRequest(null);
// // //       setDecision('');
// // //       setComment('');
// // //     } catch (error) {
// // //       console.error('Error updating request:', error);
// // //     }
// // //   };

// // //   if (loading) return <div className="loading">Loading requests...</div>;

// // //   return (
// // //     <div className="request-management">
// // //       <h2>Pending Approval Requests</h2>
      
// // //       <div className="search-container">
// // //         <input
// // //           type="text"
// // //           placeholder="Search requests..."
// // //           value={searchTerm}
// // //           onChange={handleSearch}
// // //           className="search-input"
// // //         />
// // //       </div>

// // //       <div className="requests-list">
// // //         {requests.length === 0 ? (
// // //           <p className="no-requests">No pending requests found</p>
// // //         ) : (
// // //           requests.map((request) => (
// // //             <div 
// // //               key={request.id} 
// // //               className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
// // //               onClick={() => setSelectedRequest(request)}
// // //             >
// // //               <h3>System: {request.system.name}</h3>
// // //               <p>Requested by: {request.requested_by_user.name}</p>
// // //               <p>Date: {new Date(request.created_at).toLocaleString()}</p>
// // //               <p>Reason: {request.reason}</p>
// // //             </div>
// // //           ))
// // //         )}
// // //       </div>

// // //       {requests.length > 0 && (
// // //         <div className="pagination">
// // //           <button 
// // //             disabled={page === 1} 
// // //             onClick={() => setPage(p => p - 1)}
// // //           >
// // //             Previous
// // //           </button>
// // //           <span>Page {page} of {totalPages}</span>
// // //           <button 
// // //             disabled={page === totalPages} 
// // //             onClick={() => setPage(p => p + 1)}
// // //           >
// // //             Next
// // //           </button>
// // //         </div>
// // //       )}

// // //       {selectedRequest && (
// // //         <div className="decision-panel">
// // //           <h3>Review Request</h3>
// // //           <div className="form-group">
// // //             <label>Decision:</label>
// // //             <div className="decision-options">
// // //               <button
// // //                 className={`decision-btn approve ${decision === 'approve' ? 'active' : ''}`}
// // //                 onClick={() => setDecision('approve')}
// // //               >
// // //                 Approve
// // //               </button>
// // //               <button
// // //                 className={`decision-btn reject ${decision === 'reject' ? 'active' : ''}`}
// // //                 onClick={() => setDecision('reject')}
// // //               >
// // //                 Reject
// // //               </button>
// // //             </div>
// // //           </div>
          
// // //           <div className="form-group">
// // //             <label>Comments:</label>
// // //             <textarea
// // //               value={comment}
// // //               onChange={(e) => setComment(e.target.value)}
// // //               rows={3}
// // //               placeholder="Add any comments (optional)"
// // //             />
// // //           </div>
          
// // //           <button
// // //             className="submit-btn"
// // //             onClick={handleApproveReject}
// // //             disabled={!decision}
// // //           >
// // //             Submit Decision
// // //           </button>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // export default RequestManagement;

// // import React, { useEffect, useState } from 'react';
// // import { useAuth } from './AuthContext';
// // import './RequestManagement.css';

// // function RequestManagement() {
// //   const { user, token } = useAuth();
// //   const [requests, setRequests] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedRequest, setSelectedRequest] = useState(null);
// //   const [decision, setDecision] = useState('');
// //   const [comment, setComment] = useState('');
// //   const [page, setPage] = useState(1);
// //   const [totalPages, setTotalPages] = useState(1);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [expandedRequest, setExpandedRequest] = useState(null);

// //   const fetchRequests = async () => {
// //     try {
// //       setLoading(true);
// //       const response = await fetch(
// //         `http://localhost:8000/api/v1/requests/pending?page=${page}&search=${searchTerm}`,
// //         {
// //           headers: {
// //             Authorization: `Bearer ${token}`,
// //           },
// //         }
// //       );
      
// //       if (!response.ok) {
// //         throw new Error('Failed to fetch requests');
// //       }

// //       const data = await response.json();
// //       setRequests(data.items || []);
// //       setTotalPages(data.total_pages || 1);
// //     } catch (error) {
// //       console.error('Error fetching requests:', error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchRequests();
// //   }, [token, page, searchTerm]);

// //   const handleSearch = (e) => {
// //     setSearchTerm(e.target.value);
// //     setPage(1);
// //   };

// //   const handleApproveReject = async () => {
// //     if (!decision || !selectedRequest) return;

// //     const confirmAction = window.confirm(
// //       `Are you sure you want to ${decision} this request?`
// //     );
// //     if (!confirmAction) return;

// //     try {
// //       const response = await fetch(
// //         `http://localhost:8000/api/v1/requests/${selectedRequest.id}/${decision}`,
// //         {
// //           method: 'PATCH',
// //           headers: {
// //             'Content-Type': 'application/json',
// //             Authorization: `Bearer ${token}`,
// //           },
// //           body: JSON.stringify({ comment }),
// //         }
// //       );

// //       if (!response.ok) {
// //         throw new Error('Failed to update request');
// //       }

// //       fetchRequests();
// //       setSelectedRequest(null);
// //       setDecision('');
// //       setComment('');
// //     } catch (error) {
// //       console.error('Error updating request:', error);
// //     }
// //   };

// //   const toggleExpandRequest = (requestId) => {
// //     setExpandedRequest(expandedRequest === requestId ? null : requestId);
// //   };

// //   if (loading) return <div className="loading">Loading requests...</div>;

// //   return (
// //     <div className="request-management">
// //       <h2>Pending Approval Requests</h2>
      
// //       <div className="search-container">
// //         <input
// //           type="text"
// //           placeholder="Search requests..."
// //           value={searchTerm}
// //           onChange={handleSearch}
// //           className="search-input"
// //         />
// //       </div>

// //       <div className="requests-list">
// //         {requests.length === 0 ? (
// //           <p className="no-requests">No pending requests found</p>
// //         ) : (
// //           requests.map((request) => (
// //             <div 
// //               key={request.id} 
// //               className={`request-card ${expandedRequest === request.id ? 'expanded' : ''}`}
// //             >
// //               <div 
// //                 className="request-summary"
// //                 onClick={() => toggleExpandRequest(request.id)}
// //               >
// //                 <h3>{request.system.name}</h3>
// //                 <p>Requested by: {request.requested_by_user.name}</p>
// //                 <p>Date: {new Date(request.created_at).toLocaleString()}</p>
// //                 <button 
// //                   className="expand-btn"
// //                   onClick={(e) => {
// //                     e.stopPropagation();
// //                     toggleExpandRequest(request.id);
// //                   }}
// //                 >
// //                   {expandedRequest === request.id ? '▲' : '▼'}
// //                 </button>
// //               </div>
              
// //               {expandedRequest === request.id && (
// //                 <div className="request-details">
// //                   <div className="detail-section">
// //                     <h4>Reason for Request:</h4>
// //                     <p>{request.reason || "No reason provided"}</p>
// //                   </div>
                  
// //                   <div className="detail-section">
// //                     <h4>System Details:</h4>
// //                     <p>Type: {request.system.system_type}</p>
// //                     <p>Status: {request.system.is_approved ? 'Approved' : 'Pending'}</p>
// //                   </div>
                  
// //                   <div className="action-buttons">
// //                     <button
// //                       className="decision-btn approve"
// //                       onClick={() => {
// //                         setSelectedRequest(request);
// //                         setDecision('approve');
// //                       }}
// //                     >
// //                       Approve
// //                     </button>
// //                     <button
// //                       className="decision-btn reject"
// //                       onClick={() => {
// //                         setSelectedRequest(request);
// //                         setDecision('reject');
// //                       }}
// //                     >
// //                       Reject
// //                     </button>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           ))
// //         )}
// //       </div>

// //       {requests.length > 0 && (
// //         <div className="pagination">
// //           <button 
// //             disabled={page === 1} 
// //             onClick={() => setPage(p => p - 1)}
// //           >
// //             Previous
// //           </button>
// //           <span>Page {page} of {totalPages}</span>
// //           <button 
// //             disabled={page === totalPages} 
// //             onClick={() => setPage(p => p + 1)}
// //           >
// //             Next
// //           </button>
// //         </div>
// //       )}

// //       {selectedRequest && (
// //         <div className="decision-modal">
// //           <div className="modal-content">
// //             <h3>Confirm Decision for {selectedRequest.system.name}</h3>
            
// //             <div className="form-group">
// //               <label>Comments (optional):</label>
// //               <textarea
// //                 value={comment}
// //                 onChange={(e) => setComment(e.target.value)}
// //                 rows={3}
// //                 placeholder="Add any comments"
// //               />
// //             </div>
            
// //             <div className="modal-actions">
// //               <button
// //                 className="cancel-btn"
// //                 onClick={() => setSelectedRequest(null)}
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 className={`submit-btn ${decision}`}
// //                 onClick={handleApproveReject}
// //               >
// //                 Confirm {decision}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default RequestManagement;
// import React, { useEffect, useState } from 'react';
// import { useAuth } from './AuthContext';
// import './RequestManagement.css';

// function RequestManagement() {
//   const { user, token } = useAuth();
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [decision, setDecision] = useState('');
//   const [comment, setComment] = useState('');
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [searchTerm, setSearchTerm] = useState('');

//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       // Ensure token exists before making the request
//       if (!token) {
//         throw new Error('Authentication token is missing');
//       }

//       const url = new URL(`http://localhost:8000/api/v1/requests/pending`);
//       url.searchParams.append('page', page);
//       if (searchTerm) {
//         url.searchParams.append('search', searchTerm);
//       }

//       const response = await fetch(url, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to fetch requests');
//       }

//       const data = await response.json();
//       setRequests(data.items || []);
//       setTotalPages(data.total_pages || 1);
//     } catch (error) {
//       console.error('Request Error:', error);
//       setError(error.message || 'Failed to load requests');
//       setRequests([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApproveReject = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       if (!selectedRequest || !decision) {
//         throw new Error('No request or decision selected');
//       }

//       const response = await fetch(
//         `http://localhost:8000/api/v1/requests/${selectedRequest.id}/${decision}`,
//         {
//           method: 'PATCH',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({ comment: comment || undefined }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to process request');
//       }

//       // Refresh the list after successful action
//       await fetchRequests();
//       setSelectedRequest(null);
//       setDecision('');
//       setComment('');
//     } catch (error) {
//       console.error('Action Error:', error);
//       setError(error.message || 'Failed to process request');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRequests();
//   }, [token, page, searchTerm]);

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value.trim());
//     setPage(1);
//   };

//   if (loading && requests.length === 0) {
//     return <div className="loading">Loading requests...</div>;
//   }

//   return (
//     <div className="request-management">
//       <h2>Pending Approval Requests</h2>
      
//       {error && <div className="error-message">{error}</div>}

//       <div className="controls">
//         <input
//           type="text"
//           placeholder="Search requests..."
//           value={searchTerm}
//           onChange={handleSearch}
//           className="search-input"
//         />
//       </div>

//       <div className="requests-list">
//         {requests.length === 0 ? (
//           <div className="no-requests">
//             {error ? 'Error loading requests' : 'No pending requests found'}
//           </div>
//         ) : (
//           requests.map((request) => (
//             <div 
//               key={request.id} 
//               className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
//               onClick={() => setSelectedRequest(request)}
//             >
//               <h3>{request.system?.name || 'Unnamed System'}</h3>
//               <p><strong>Requested by:</strong> {request.requested_by_user?.name || 'Unknown'}</p>
//               <p><strong>Date:</strong> {new Date(request.created_at).toLocaleString()}</p>
//               <p><strong>Reason:</strong> {request.reason || 'No reason provided'}</p>
//               <p><strong>Status:</strong> {request.status || 'pending'}</p>
              
//               {selectedRequest?.id === request.id && (
//                 <div className="request-actions">
//                   <button
//                     className="approve-btn"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setDecision('approve');
//                       handleApproveReject();
//                     }}
//                     disabled={loading}
//                   >
//                     {loading && decision === 'approve' ? 'Processing...' : 'Approve'}
//                   </button>
//                   <button
//                     className="reject-btn"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setDecision('reject');
//                       handleApproveReject();
//                     }}
//                     disabled={loading}
//                   >
//                     {loading && decision === 'reject' ? 'Processing...' : 'Reject'}
//                   </button>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </div>

//       {requests.length > 0 && (
//         <div className="pagination">
//           <button 
//             disabled={page === 1 || loading} 
//             onClick={() => setPage(p => p - 1)}
//           >
//             Previous
//           </button>
//           <span>Page {page} of {totalPages}</span>
//           <button 
//             disabled={page === totalPages || loading} 
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default RequestManagement;
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import './RequestManagement.css';

function RequestManagement() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState('');
  const [comment, setComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Set the number of items per page
  const requestsPerPage = 2; // Change this to 3 if you want 3 per page

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const url = new URL(`http://localhost:8000/api/v1/requests/pending`);
      url.searchParams.append('page', currentPage);
      url.searchParams.append('per_page', requestsPerPage);
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.items || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Request Error:', error);
      setError(error.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedRequest || !decision) {
        throw new Error('No request or decision selected');
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/requests/${selectedRequest.id}/${decision}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ comment: comment || undefined }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process request');
      }

      // Refresh the list after successful action
      await fetchRequests();
      setSelectedRequest(null);
      setDecision('');
      setComment('');
    } catch (error) {
      console.error('Action Error:', error);
      setError(error.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token, currentPage, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim());
    setCurrentPage(1);
  };

  if (loading && requests.length === 0) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="request-management">
      <h2>Pending Approval Requests</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="requests-list">
        {requests.length === 0 ? (
          <div className="no-requests">
            {error ? 'Error loading requests' : 'No pending requests found'}
          </div>
        ) : (
          requests.map((request) => (
            <div 
              key={request.id} 
              className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
              onClick={() => setSelectedRequest(request)}
            >
              <h3>{request.system?.name || 'Unnamed System'}</h3>
              <p><strong>Requested by:</strong> {request.requested_by_user?.name || 'Unknown'}</p>
              <p><strong>Date:</strong> {new Date(request.created_at).toLocaleString()}</p>
              <p><strong>Reason:</strong> {request.reason || 'No reason provided'}</p>
              <p><strong>Status:</strong> {request.status || 'pending'}</p>
              
              {selectedRequest?.id === request.id && (
                <div className="request-actions">
                  <button
                    className="approve-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDecision('approve');
                      handleApproveReject();
                    }}
                    disabled={loading}
                  >
                    {loading && decision === 'approve' ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDecision('reject');
                      handleApproveReject();
                    }}
                    disabled={loading}
                  >
                    {loading && decision === 'reject' ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {requests.length > 0 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1 || loading} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages || loading} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default RequestManagement;