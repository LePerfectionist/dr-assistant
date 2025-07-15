
// Sidebar.js
import React from "react";
import "./Sidebar.css";

function Sidebar({ systems, selectedId, onSelect }) {
  return (
    <div className="sidebar">
      <h3>Extracted Systems</h3>
      <ul>
        {systems.map((sys) => (
          <li
            key={sys.id}
            className={sys.id === selectedId ? "active" : ""}
            onClick={() => onSelect(sys)}
          >
            {sys.name}
            {sys.is_approved && <span className="tick">✔️</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
