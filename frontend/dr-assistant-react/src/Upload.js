// // // import React, { useState } from "react";
// // // import "./Upload.css";

// // // /**
// // //  * Upload component for uploading runbooks and extracting systems.
// // //  * Supports drag-and-drop, progress indicator, and canceling upload.
// // //  * Designed for the new backend System model.
// // //  */
// // // function Upload({ token, setSystems, setApplicationId, onSelect, selectedId }) {
// // //   const [loading, setLoading] = useState(false);
// // //   const [fileName, setFileName] = useState("");
// // //   const [dragActive, setDragActive] = useState(false);
// // //   const [progress, setProgress] = useState(0);
// // //   const [abortController, setAbortController] = useState(null);

// // //   const resetState = () => {
// // //     setFileName("");
// // //     setProgress(0);
// // //     setSystems([]);
// // //     setApplicationId(null);
// // //   };

// // //   const handleFileUpload = async (file) => {
// // //     if (!file || !token) return;

// // //     setLoading(true);
// // //     setProgress(10);
// // //     setFileName(file.name);

// // //     const formData = new FormData();
// // //     formData.append("file", file);

// // //     const controller = new AbortController();
// // //     setAbortController(controller);

// // //     try {
// // //       // Upload
// // //       const uploadRes = await fetch("http://localhost:8000/api/v1/documents/upload", {
// // //         method: "POST",
// // //         headers: { Authorization: `Bearer ${token}` },
// // //         body: formData,
// // //         signal: controller.signal,
// // //       });

// // //       if (!uploadRes.ok) throw new Error("Upload failed");
// // //       const uploadData = await uploadRes.json();
// // //       const appId = uploadData.id;

// // //       setApplicationId(appId);
// // //       setProgress(50);

// // //       // Extract systems
// // //       const extractRes = await fetch(`http://localhost:8000/api/v1/extraction/${appId}/extract_systems`, {
// // //         method: "POST",
// // //         headers: { Authorization: `Bearer ${token}` },
// // //         signal: controller.signal,
// // //       });

// // //       if (!extractRes.ok) throw new Error("Extraction failed");

// // //       const systems = await extractRes.json();

// // //       // Ensure new System fields are handled gracefully
// // //       const enrichedSystems = systems.map((sys) => ({
// // //         ...sys,
// // //         upstream_dependencies: sys.upstream_dependencies || [],
// // //         downstream_dependencies: sys.downstream_dependencies || [],
// // //         key_contacts: sys.key_contacts || [],
// // //         system_type: sys.system_type || "internal",
// // //       }));

// // //       setSystems(enrichedSystems);
// // //       if (enrichedSystems.length > 0 && typeof onSelect === "function") {
// // //         onSelect(enrichedSystems[0]);
// // //       }

// // //       setProgress(100);
// // //     } catch (err) {
// // //       if (err.name === "AbortError") {
// // //         alert("Upload canceled.");
// // //       } else {
// // //         console.error("Upload/Extraction error:", err);
// // //         alert("Failed to upload or extract systems. Please try again.");
// // //       }
// // //       resetState();
// // //     } finally {
// // //       setLoading(false);
// // //       setAbortController(null);
// // //     }
// // //   };

// // //   const handleFileChange = (e) => {
// // //     const file = e.target.files[0];
// // //     if (file) handleFileUpload(file);
// // //   };

// // //   const handleDrop = (e) => {
// // //     e.preventDefault();
// // //     setDragActive(false);
// // //     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
// // //       handleFileUpload(e.dataTransfer.files[0]);
// // //     }
// // //   };

// // //   const handleDrag = (e) => {
// // //     e.preventDefault();
// // //     setDragActive(e.type === "dragenter" || e.type === "dragover");
// // //   };

// // //   const cancelUpload = () => {
// // //     if (abortController) {
// // //       abortController.abort();
// // //     }
// // //   };

// // //   return (
// // //     <div
// // //       className={`upload-box ${dragActive ? "drag-active" : ""}`}
// // //       onDragEnter={handleDrag}
// // //       onDragLeave={handleDrag}
// // //       onDragOver={handleDrag}
// // //       onDrop={handleDrop}
// // //     >
// // //       <label className="upload-label">
// // //         Upload Runbook
// // //         <input type="file" onChange={handleFileChange} />
// // //       </label>

// // //       {fileName && <p className="file-name">📄 {fileName}</p>}

// // //       {loading && (
// // //         <>
// // //           <div className="progress-bar">
// // //             <div className="progress-fill" style={{ width: `${progress}%` }}></div>
// // //           </div>
// // //           <button className="cancel-btn" onClick={cancelUpload}>
// // //             Cancel Upload
// // //           </button>
// // //         </>
// // //       )}

// // //       {dragActive && <div className="drop-message">Drop file here</div>}
// // //     </div>
// // //   );
// // // }

// // // export default Upload;
// // import React, { useState } from "react";
// // import "./Upload.css";

// // function Upload({ token, appName, setSystems, setApplicationId, onSelect, selectedId, onBack }) {
// //   const [loading, setLoading] = useState(false);
// //   const [fileName, setFileName] = useState("");
// //   const [dragActive, setDragActive] = useState(false);
// //   const [progress, setProgress] = useState(0);
// //   const [abortController, setAbortController] = useState(null);

// //   const resetState = () => {
// //     setFileName("");
// //     setProgress(0);
// //     setSystems([]);
// //     setApplicationId(null);
// //   };

// //   const handleFileUpload = async (file) => {
// //     if (!file || !token) return;

// //     setLoading(true);
// //     setProgress(10);
// //     setFileName(file.name);

// //     const formData = new FormData();
// //     formData.append("file", file);
// //     formData.append("name", appName);

// //     const controller = new AbortController();
// //     setAbortController(controller);

// //     try {
// //       const uploadRes = await fetch("http://localhost:8000/api/v1/documents/upload", {
// //         method: "POST",
// //         headers: { Authorization: `Bearer ${token}` },
// //         body: formData,
// //         signal: controller.signal,
// //       });

// //       if (!uploadRes.ok) throw new Error("Upload failed");
// //       const uploadData = await uploadRes.json();
// //       const appId = uploadData.id;

// //       setApplicationId(appId);
// //       setProgress(50);

// //       const extractRes = await fetch(`http://localhost:8000/api/v1/extraction/${appId}/extract_systems`, {
// //         method: "POST",
// //         headers: { Authorization: `Bearer ${token}` },
// //         signal: controller.signal,
// //       });

// //       if (!extractRes.ok) throw new Error("Extraction failed");

// //       const systems = await extractRes.json();

// //       const enrichedSystems = systems.map((sys) => ({
// //         ...sys,
// //         upstream_dependencies: sys.upstream_dependencies || [],
// //         downstream_dependencies: sys.downstream_dependencies || [],
// //         key_contacts: sys.key_contacts || [],
// //         system_type: sys.system_type || "internal",
// //       }));

// //       setSystems(enrichedSystems);
// //       if (enrichedSystems.length > 0 && typeof onSelect === "function") {
// //         onSelect(enrichedSystems[0]);
// //       }

// //       setProgress(100);
// //     } catch (err) {
// //       if (err.name === "AbortError") {
// //         alert("Upload canceled.");
// //       } else {
// //         console.error("Upload/Extraction error:", err);
// //         alert("Failed to upload or extract systems. Please try again.");
// //       }
// //       resetState();
// //     } finally {
// //       setLoading(false);
// //       setAbortController(null);
// //     }
// //   };

// //   const handleFileChange = (e) => {
// //     const file = e.target.files[0];
// //     if (file) handleFileUpload(file);
// //   };

// //   const handleDrop = (e) => {
// //     e.preventDefault();
// //     setDragActive(false);
// //     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
// //       handleFileUpload(e.dataTransfer.files[0]);
// //     }
// //   };

// //   const handleDrag = (e) => {
// //     e.preventDefault();
// //     setDragActive(e.type === "dragenter" || e.type === "dragover");
// //   };

// //   const cancelUpload = () => {
// //     if (abortController) {
// //       abortController.abort();
// //     }
// //   };

// //   return (
// //     <div
// //       className={`upload-box ${dragActive ? "drag-active" : ""}`}
// //       onDragEnter={handleDrag}
// //       onDragLeave={handleDrag}
// //       onDragOver={handleDrag}
// //       onDrop={handleDrop}
// //     >
// //       <button onClick={onBack} className="back-button">
// //         ← Back to Name
// //       </button>
      
// //       <label className="upload-label">
// //         Upload Runbook for {appName}
// //         <input type="file" onChange={handleFileChange} />
// //       </label>

// //       {fileName && <p className="file-name">📄 {fileName}</p>}

// //       {loading && (
// //         <>
// //           <div className="progress-bar">
// //             <div className="progress-fill" style={{ width: `${progress}%` }}></div>
// //           </div>
// //           <button className="cancel-btn" onClick={cancelUpload}>
// //             Cancel Upload
// //           </button>
// //         </>
// //       )}

// //       {dragActive && <div className="drop-message">Drop file here</div>}
// //     </div>
// //   );
// // }

// // export default Upload;
// import React, { useState } from "react";
// import "./Upload.css";

// function Upload({ token, appName, setSystems, setApplicationId, onSelect, onBack }) {
//   const [loading, setLoading] = useState(false);
//   const [fileName, setFileName] = useState("");
//   const [dragActive, setDragActive] = useState(false);
//   const [error, setError] = useState(null);

//   const handleFileUpload = async (file) => {
//     if (!file || !token || !appName) {
//       setError("Missing required information");
//       return;
//     }

//     setLoading(true);
//     setFileName(file.name);
//     setError(null);

//     const formData = new FormData();
//     formData.append("name", appName);
//     formData.append("files", file);

//     try {
//       const response = await fetch(
//         "http://localhost:8000/api/v1/validation/upload_documents/",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           body: formData,
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Upload failed");
//       }

//       const result = await response.json();
      
//       // Fetch the created systems
//       const systemsResponse = await fetch(
//         `http://localhost:8000/api/v1/validation/applications/${result.application_id}/systems`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const systems = await systemsResponse.json();
      
//       setApplicationId(result.application_id);
//       setSystems(systems);
//       if (systems.length > 0) {
//         onSelect(systems[0]);
//       }

//     } catch (err) {
//       console.error("Upload error:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) handleFileUpload(file);
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       handleFileUpload(e.dataTransfer.files[0]);
//     }
//   };

//   return (
//     <div className={`upload-container ${dragActive ? "drag-active" : ""}`}>
//       <button onClick={onBack} className="back-button">
//         ← Back to Name
//       </button>
      
//       <h3>Upload Runbook for: {appName}</h3>
      
//       <div
//         className="upload-area"
//         onDragEnter={handleDrag}
//         onDragLeave={handleDrag}
//         onDragOver={handleDrag}
//         onDrop={handleDrop}
//       >
//         <input 
//           type="file" 
//           id="file-upload"
//           onChange={handleFileChange}
//           accept=".docx,.pdf"
//           className="file-input"
//         />
//         <label htmlFor="file-upload" className="upload-label">
//           {loading ? (
//             <span>Uploading {fileName}...</span>
//           ) : (
//             <span>Drag & Drop or Click to Browse</span>
//           )}
//         </label>
        
//         {fileName && !loading && (
//           <div className="file-info">Selected: {fileName}</div>
//         )}
//         {error && <div className="error-message">{error}</div>}
//       </div>
//     </div>
//   );
// }

// export default Upload;

import React, { useState } from "react";
import "./Upload.css";

function Upload({ 
  token, 
  appName, 
  setSystems, 
  setApplicationId, 
  onSelect, 
  selectedId, 
  onBack 
}) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState(null);
  const [error, setError] = useState(null);

  const resetState = () => {
    setFileName("");
    setProgress(0);
    setSystems([]);
    setApplicationId(null);
    setError(null);
  };

  const handleFileUpload = async (file) => {
    if (!file || !token || !appName) {
      setError("Missing required information");
      return;
    }

    setLoading(true);
    setProgress(10);
    setFileName(file.name);
    setError(null);

    const formData = new FormData();
    formData.append("name", appName);
    formData.append("files", file);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // First upload the document
      const uploadRes = await fetch(
        "http://localhost:8000/api/v1/validation/upload_documents/", 
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          signal: controller.signal,
        }
      );

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      const appId = uploadData.application_id;

      setApplicationId(appId);
      setProgress(50);

      // Then extract systems from the uploaded document
      const extractRes = await fetch(
        `http://localhost:8000/api/v1/extraction/${appId}/extract_systems`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );

      if (!extractRes.ok) {
        throw new Error("Extraction failed");
      }

      const systems = await extractRes.json();

      // Enhance system data with defaults
      const enrichedSystems = systems.map((sys) => ({
        ...sys,
        upstream_dependencies: sys.upstream_dependencies || [],
        downstream_dependencies: sys.downstream_dependencies || [],
        key_contacts: sys.key_contacts || [],
        system_type: sys.system_type || "internal",
        source_reference: sys.source_reference || file.name,
      }));

      setSystems(enrichedSystems);
      if (enrichedSystems.length > 0 && typeof onSelect === "function") {
        onSelect(enrichedSystems[0]);
      }

      setProgress(100);
    } catch (err) {
      if (err.name === "AbortError") {
        alert("Upload canceled.");
      } else {
        console.error("Upload/Extraction error:", err);
        setError(err.message);
        alert(`Failed to process file: ${err.message}`);
      }
      resetState();
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort();
    }
    resetState();
  };

  return (
    <div
      className={`upload-box ${dragActive ? "drag-active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <button onClick={onBack} className="back-button">
        ← Back to Name
      </button>
      
      <label className="upload-label">
        Upload Runbook for {appName}
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".docx,.pdf"
          disabled={loading}
        />
      </label>

      {fileName && (
        <p className="file-name">
          {loading ? "📤 Uploading:" : "📄 Selected:"} {fileName}
        </p>
      )}

      {loading && (
        <>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
          <button 
            className="cancel-btn" 
            onClick={cancelUpload}
            disabled={!loading}
          >
            Cancel Upload
          </button>
        </>
      )}

      {dragActive && (
        <div className="drop-message">Drop your runbook file here</div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default Upload;