// import React, { useState } from "react";
// import Upload from "./Upload";
// import Sidebar from "./Sidebar";
// import ChatBubble from "./ChatBubble";
// import LoginForm from "./LoginForm";
// import RegisterForm from "./RegisterForm";
// import { useAuth, AuthProvider } from "./AuthContext";
// import "./App.css";

// function AppContent() {
//   const { user, token, logout } = useAuth();
//   const [view, setView] = useState("login");
//   const [systems, setSystems] = useState([]);
//   const [applicationId, setApplicationId] = useState(null);

//   if (!user) {
//     return (
//       <div className="auth-wrapper">
//         {view === "login" ? (
//           <LoginForm onSwitch={() => setView("register")} />
//         ) : (
//           <RegisterForm onSwitch={() => setView("login")} />
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <h1>DR Assistant</h1>
//         <div className="header-actions">
//           <span>Welcome, {user.name} ({user.role})</span>
//           <button onClick={logout}>Logout</button>
//         </div>
//       </header>
//       <main className="app-main">
//         <Upload token={token} setSystems={setSystems} setApplicationId={setApplicationId} />
//         <Sidebar systems={systems} setSystems={setSystems} />
//         <ChatBubble token={token} applicationId={applicationId} />
//       </main>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// }
// App.js
import React, { useState } from "react";
import Upload from "./Upload";
import Sidebar from "./Sidebar";
import ChatBubble from "./ChatBubble";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import SystemDetail from "./SystemDetail";
import { useAuth, AuthProvider } from "./AuthContext";
import "./App.css";


function AppContent() {
  const { user, token, logout } = useAuth();
  const [view, setView] = useState("login");
  const [systems, setSystems] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);

  const handleApprove = async (systemId) => {
    const res = await fetch(`http://localhost:8000/api/v1/systems/${systemId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSystems(prev => prev.map(s => s.id === systemId ? { ...s, is_approved: true } : s));
      if (selectedSystem?.id === systemId) {
        setSelectedSystem({ ...selectedSystem, is_approved: true });
      }
    } else {
      alert("Approval failed");
    }
  };

  if (!user) {
    return (
      <div className="auth-wrapper">
        {view === "login" ? (
          <LoginForm onSwitch={() => setView("register")} />
        ) : (
          <RegisterForm onSwitch={() => setView("login")} />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DR Assistant</h1>
        <div className="header-actions">
          <span>Welcome, {user.name} ({user.role})</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="app-main">
        <Upload token={token} setSystems={setSystems} setApplicationId={setApplicationId} />
        <Sidebar systems={systems} onSelect={setSelectedSystem} selectedId={selectedSystem?.id} />

        <SystemDetail system={selectedSystem} user={user} onApprove={handleApprove} />
        <ChatBubble token={token} application={applicationId} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
