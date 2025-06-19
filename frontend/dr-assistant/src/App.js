import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import ChatBubble from "./ChatBubble";
import "./App.css";

const systems = ["Payments (EPH)", "Core Banking (Temenos)", "Cards (Vision Plus+)"];

function App() {
  const [systemStates, setSystemStates] = useState({});
  const [drSteps, setDrSteps] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
    setUploadStatus(null);
  };

  const [sessionId, setSessionId] = useState(null);

const handleUpload = async () => {
  if (!files.length) return alert("Please select a file to upload");

  const formData = new FormData();
  for (let file of files) {
    formData.append("files", file);
  }

  try {
    setIsUploading(true);
    setUploadStatus(null);
    const res = await axios.post("http://localhost:8000/upload_runbooks", formData);
    const { session_id } = res.data;
    setSessionId(session_id);  // ✅ Save for later use
    setUploadStatus("File embeddings created successfully ✅");
  } catch (error) {
    setUploadStatus("Upload failed ❌");
    console.error(error);
  } finally {
    setIsUploading(false);
  }
};


  const handleSystemChange = (system, value) => {
    setSystemStates((prev) => ({ ...prev, [system]: value }));
  };

  const handleGenerate = async () => {
    if (!sessionId) return alert("Upload files first to generate session");
  
    try {
      setIsGenerating(true);
  
      const system_choices = systems.reduce((acc, s) => {
        acc[s] = systemStates[s] || "Primary";
        return acc;
      }, {});
  
      const res = await axios.post("http://localhost:8000/generate-dr-steps", {
        session_id: sessionId,
        system_choices,
      });
  
      setDrSteps(res.data.dr_steps);
    } catch (err) {
      console.error("DR Step error:", err);
      setDrSteps("⚠️ Could not generate DR steps. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };
  

  return (
    <div className="app-container">
      <header className="header">
        <img
          src="https://digitalprocurement.dib.ae/images/logo.png"
          alt="Logo"
          className="logo"
        />
        <span className="title">Generative AI-Powered Disaster Recovery Assistant</span>
      </header>

      <div className="upload-section">
        <label className="section-label">Upload Runbooks (.pdf or .docx)</label>
        <input type="file" multiple onChange={handleFileChange} className="file-input" />
        <button onClick={handleUpload} className="upload-button" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
      </div>

      <div className="system-section">
        <label className="section-label">Select System States</label>
        {systems.map((system) => (
          <div key={system} className="system-row">
            <span>{system}</span>
            <select onChange={(e) => handleSystemChange(system, e.target.value)}>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
        ))}
        <button onClick={handleGenerate} className="generate-button" disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate DR Steps"}
        </button>
      </div>

      {drSteps && (
        <div className="result-section">
          <h3>Steps to Execute DR Procedures:</h3>
          <ReactMarkdown>{drSteps}</ReactMarkdown>
        </div>
      )}

      <ChatBubble sessionId={sessionId} />

    </div>
  );
}

export default App;