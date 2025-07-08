// App.js
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";     // Renders markdown text as HTML
import { useDropzone } from "react-dropzone";   // Provides drag‑and‑drop file upload
import ChatBubble from "./ChatBubble";          // Floating chat assistant
import "./App.css";                             // Stylesheet

// Simulated current user info (DR Manager or Admin)
const currentUser = {
  username: "gautam",
  role: "dr_manager"  // Change to "admin" for admin features
};

function App() {
  // ----------------- State Variables -----------------
  const [data, setData] = useState({});              // Stores parsed JSON for each file
  const [uploadedFiles, setUploadedFiles] = useState([]);       // List of {name, id} for each file
  const [expandedFiles, setExpandedFiles] = useState({});       // Tracks which files are expanded
  const [selectedSection, setSelectedSection] = useState(null); // e.g. "fileId||SectionName"
  const [validations, setValidations] = useState({});           // { "fileId||Section": {by, at} }
  const [auditLog, setAuditLog] = useState([]);                 // Array of {section, action, by, at}
  const [searchQuery, setSearchQuery] = useState("");           // Filters file list
  const [sectionSearch, setSectionSearch] = useState({});       // Filters sections per file

  // ----------------- Effects: Load / Save -----------------

  // On first render, load validations & audit log from localStorage
  useEffect(() => {
    const savedValidations = JSON.parse(localStorage.getItem("dr_validations")) || {};
    const savedLog         = JSON.parse(localStorage.getItem("dr_audit_log")) || [];
    setValidations(savedValidations);
    setAuditLog(savedLog);
  }, []);

  // Whenever validations or auditLog change, persist them
  useEffect(() => {
    localStorage.setItem("dr_validations", JSON.stringify(validations));
    localStorage.setItem("dr_audit_log", JSON.stringify(auditLog));
  }, [validations, auditLog]);

  // ----------------- File Upload Logic -----------------

  // Called when files are dropped or selected
  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      // Skip duplicates
      if (uploadedFiles.some((f) => f.name === file.name)) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // Parse JSON file contents
          const parsed = JSON.parse(event.target.result);
          const fileId = file.name.replace(/\..+$/, "");  // Strip extension
          // Add to list and data map
          setUploadedFiles((prev) => [...prev, { name: file.name, id: fileId }]);
          setData((prev) => ({ ...prev, [fileId]: parsed }));
        } catch {
          alert("Invalid JSON in file: " + file.name);
        }
      };
      reader.readAsText(file);
    });
  };

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc", ".docx"],
      "image/*": [],
    },
  });

  // ----------------- File & Section Management -----------------

  // Completely clear all files and reset state
  const handleClearAll = () => {
    setData({});
    setUploadedFiles([]);
    setExpandedFiles({});
    setSelectedSection(null);
    setSectionSearch({});
  };

  // Remove a single file and clean up related state
  const handleDeleteFile = (fileId) => {
    // Remove from uploadedFiles
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

    // Remove its parsed data
    setData((prev) => {
      const copy = { ...prev };
      delete copy[fileId];
      return copy;
    });

    // Collapse if it was expanded
    setExpandedFiles((prev) => {
      const copy = { ...prev };
      delete copy[fileId];
      return copy;
    });

    // If currently viewing a section from this file, clear selection
    if (selectedSection?.startsWith(fileId + "||")) {
      setSelectedSection(null);
    }
  };

  // Show only files matching the search query
  const filteredFiles = uploadedFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render the list of sections inside an expanded file
  const renderSections = (fileId) => {
    const fileData = data[fileId] || {};
    const query = (sectionSearch[fileId] || "").toLowerCase();

    // Filter section keys by the per-file search bar
    const filtered = Object.entries(fileData).filter(([key]) =>
      key.toLowerCase().includes(query)
    );

    return (
      <>
        {/* Section-level search input */}
        <input
          type="text"
          className="section-search"
          placeholder="Search sections..."
          value={sectionSearch[fileId] || ""}
          onChange={(e) =>
            setSectionSearch({ ...sectionSearch, [fileId]: e.target.value })
          }
        />
        {/* List each filtered section */}
        {filtered.map(([sectionKey]) => (
          <div
            key={fileId + "||" + sectionKey}
            className={`section-item ${
              selectedSection === fileId + "||" + sectionKey ? "active" : ""
            }`}
            onClick={() => setSelectedSection(fileId + "||" + sectionKey)}
          >
            {sectionKey}
            {/* Show checkmark if validated */}
            {validations[fileId + "||" + sectionKey] && " ✔️"}
          </div>
        ))}
      </>
    );
  };

  // ----------------- Validation & Audit -----------------

  // Mark the selected section as validated
  const handleValidate = () => {
    if (!selectedSection) return;
    const timestamp = new Date().toLocaleString();
    setValidations({
      ...validations,
      [selectedSection]: { by: currentUser.username, at: timestamp },
    });
    setAuditLog([
      ...auditLog,
      { section: selectedSection, action: "validated", by: currentUser.username, at: timestamp },
    ]);
  };

  // Revoke validation on a section (admin only)
  const handleRevoke = () => {
    if (!selectedSection) return;
    const timestamp = new Date().toLocaleString();
    const copy = { ...validations };
    delete copy[selectedSection];
    setValidations(copy);
    setAuditLog([
      ...auditLog,
      { section: selectedSection, action: "revoked", by: currentUser.username, at: timestamp },
    ]);
  };

  // ----------------- Determine Selected Content -----------------
  // selectedSection format: "fileId||SectionName"
  const [fileId, sectionKey] = selectedSection?.split("||") || [];
  const selectedContent = data[fileId]?.[sectionKey]?.dr_data;

  // ----------------- Render UI -----------------
  return (
    <div className="container">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <h2>Uploaded Files</h2>

        {/* File search input */}
        <input
          type="text"
          className="file-search"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Drag & drop upload area */}
        <div className="file-upload" {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop here…</p> : <p>Drag & drop or click to upload</p>}
        </div>

        {/* Clear all button */}
        <button className="btn clear-btn" onClick={handleClearAll}>
          Clear All
        </button>

        {/* File list */}
        <div className="file-list">
          <h3 className="section-heading">Sections</h3>
          {filteredFiles.map((file) => {
            const isExpanded = expandedFiles[file.id];
            return (
              <div
                key={file.id}
                className={`file-container ${isExpanded ? "expanded" : ""}`}
              >
                {/* File header with expand icon and delete button */}
                <div
                  className="file-header"
                  onClick={() =>
                    setExpandedFiles((prev) => ({
                      ...prev,
                      [file.id]: !prev[file.id],
                    }))
                  }
                >
                  <span>
                    {/* Arrow indicates collapsed or expanded */}
                    <span className="expand-icon">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    {file.name}
                  </span>
                  <span
                    className="file-delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent toggling expand
                      handleDeleteFile(file.id);
                    }}
                  >
                    ✕
                  </span>
                </div>
                {/* Show sections only when expanded */}
                {isExpanded && (
                  <div className="section-group">{renderSections(file.id)}</div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="main-content">
        {selectedSection ? (
          <>
            <h2>{sectionKey}</h2>

            {/* Render DR data markdown */}
            <div className="markdown-content">
              <ReactMarkdown>{selectedContent || "_No DR data_"}</ReactMarkdown>
            </div>

            {/* Show validation status */}
            {validations[selectedSection] && (
              <p className="status">
                ✅ Validated by {validations[selectedSection].by} at{" "}
                {validations[selectedSection].at}
              </p>
            )}

            {/* DR Manager can validate/revalidate */}
            {currentUser.role === "dr_manager" && (
              <button className="btn validate-btn" onClick={handleValidate}>
                {validations[selectedSection] ? "Re-Validate" : "Validate"}
              </button>
            )}

            {/* Admin can revoke */}
            {validations[selectedSection] && currentUser.role === "admin" && (
              <button className="btn revoke-btn" onClick={handleRevoke}>
                Revoke
              </button>
            )}

            {/* Audit log list */}
            <div className="audit-log">
              <h4>Audit Log</h4>
              <ul>
                {auditLog
                  .filter((log) => log.section === selectedSection)
                  .map((log, idx) => (
                    <li key={idx}>
                      {log.at} — {log.by} {log.action} this section
                    </li>
                  ))}
              </ul>
            </div>
          </>
        ) : (
          // Prompt user when no section is selected
          <p>Select a section from sidebar to view DR details.</p>
        )}
      </main>

      {/* ===== CHATBOT ===== */}
      <ChatBubble sessionId="dr-assistant-session" />
    </div>
  );
}

export default App;
