// Upload.js
import React, { useState } from "react";
import "./Upload.css";

/**
 * Upload component allows drag-and-drop or file selection.
 * Uploads the file, triggers system extraction, and sets the results in state.
 */
function Upload({ token, setSystems, setApplicationId, onSelect, selectedId }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [abortController, setAbortController] = useState(null);

  const handleFileUpload = async (file) => {
    if (!file || !token) return;

    setLoading(true);
    setProgress(10);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Upload the file
      const uploadRes = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const appId = uploadData.id;

      setApplicationId(appId);
      setProgress(60);

      // Trigger system extraction
      const extractRes = await fetch(`http://localhost:8000/api/v1/extraction/${appId}/extract_systems`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!extractRes.ok) throw new Error("Extraction failed");

      const systems = await extractRes.json();
      setSystems(systems);
      if (systems.length > 0 && typeof onSelect === "function") {
        onSelect(systems[0]);
      }

      setProgress(100);
    } catch (err) {
      if (err.name === "AbortError") {
        alert("Upload canceled");
      } else {
        console.error(err);
        alert("Something went wrong during file upload or extraction.");
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const cancelUpload = () => {
    if (abortController) abortController.abort();
  };

  return (
    <div
      className={`upload-box ${dragActive ? "drag-active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <label className="upload-label">
        Upload Runbook
        <input type="file" onChange={handleFileChange} />
      </label>

      {fileName && <p className="file-name">📄 {fileName}</p>}

      {loading && (
        <>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <button className="cancel-btn" onClick={cancelUpload}>Cancel Upload</button>
        </>
      )}

      {dragActive && <div className="drop-message">Drop file here</div>}
    </div>
  );
}

export default Upload;
