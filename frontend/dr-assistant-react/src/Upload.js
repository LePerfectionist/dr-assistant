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
    formData.append("app_name", appName);
    formData.append("file", file);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // First upload the document
      const uploadRes = await fetch(
        "http://localhost:8000/api/v1/documents/upload", 
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
      const appId = uploadData.id;

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