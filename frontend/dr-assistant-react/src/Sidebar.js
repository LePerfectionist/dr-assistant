
// // Sidebar.js
// import React from "react";
// import "./Sidebar.css";

// function Sidebar({ systems, selectedId, onSelect }) {
//   return (
//     <div className="sidebar">
//       <h3>Extracted Systems</h3>
//       <ul>
//         {systems.map((sys) => (
//           <li
//             key={sys.id}
//             className={sys.id === selectedId ? "active" : ""}
//             onClick={() => onSelect(sys)}
//           >
//             {sys.name}
//             {sys.is_approved && <span className="tick">✔️</span>}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default Sidebar;
import React from "react";
import "./Sidebar.css";

function Sidebar({ systems, selectedId, onSelect, appName }) {
  return (
    <div className="sidebar">
       <h3>{appName || "No Application Selected"}</h3>
      <h3>{appName || "Extracted Systems"}</h3>
      <div className="systems-list">
        {systems.length === 0 ? (
          <p className="no-systems">No systems extracted yet</p>
        ) : (
          <ul>
            {systems.map((sys) => (
              <li
                key={sys.id}
                className={sys.id === selectedId ? "active" : ""}
                onClick={() => onSelect(sys)}
              >
                <span className="system-name">{sys.name}</span>
                {sys.is_approved && (
                  <span className="approval-status approved">Approved</span>
                )}
                {!sys.is_approved && (
                  <span className="approval-status pending">Pending</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Sidebar;