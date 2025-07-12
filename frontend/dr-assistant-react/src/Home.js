// Home.js
import React from "react";
import "./Home.css";

export default function Home({ setView }) {
  return (
    <div className="home-container">
      <h2>Select an option</h2>
      <div className="home-grid">
        <button className="home-card" onClick={() => setView("main")}>
          ➕ New Application<br/><small>Upload a runbook file</small>
        </button>
        <button className="home-card" onClick={() => setView("dashboard")}>
          🔍 Current Applications<br/><small>Manage existing uploads</small>
        </button>
      </div>
    </div>
  );
}
