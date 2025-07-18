import React, { useState } from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Home from "./Home";
import Dashboard from "./Dashboard";
import AnalysisPage from "./AnalysisPage";
import MainApp from "./MainApp";
import MyApplications from "./MyApplications";
import "./App.css";

function AppContent() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("home");
  const [currentAppId, setCurrentAppId] = useState(null); // <-- Add state for the ID
  const [resetKey, setResetKey] = useState(Date.now());

  // Update switchView to handle passing an ID
  const switchView = (newView, id = null) => {
    setView(newView);
    setCurrentAppId(id); // Set the ID when switching
    setResetKey(Date.now()); 
  };

  if (!user) {
    return view === "login" ? (
      <LoginForm onSwitch={() => setView("register")} />
    ) : (
      <RegisterForm onSwitch={() => setView("login")} />
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DR Assistant</h1>
        <div className="header-actions">
          <span>
            Welcome, {user.name} ({user.role})
          </span>
          <button onClick={() => switchView("home")} disabled={view === "home"}>
            🏠 Home
          </button>
          <button onClick={() => switchView("main")} disabled={view === "main"}>
            🚀 New Application
          </button>
          <button onClick={() => switchView("myapps")} disabled={view === "myapps"}>
            📂 My Applications
          </button>
          <button onClick={() => switchView("dashboard")} disabled={view === "dashboard"}>
            📊 Dashboard
          </button>
          <button onClick={logout}>🚪 Logout</button>
        </div>
      </header>

      {view === "home" && <Home setView={switchView} />}
      {view === "main" && <MainApp key={resetKey} />}
      {/* Pass the switchView function to MyApplications so it can navigate */}
      {view === "myapps" && <MyApplications setView={switchView} />}
      {view === "dashboard" && <Dashboard />}
      {/* Add the new view to the router logic */}
      {view === "analysis" && (
        <AnalysisPage applicationId={currentAppId} setView={switchView} />
      )}
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
