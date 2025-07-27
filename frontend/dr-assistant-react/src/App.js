import React, { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Home from "./Home";
import Dashboard from "./Dashboard";
import AnalysisPage from "./AnalysisPage";
import MainApp from "./MainApp";
import MyApplications from "./MyApplications";
import "./App.css";
import './responsive.css';
function AppContent() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("home");
  const [currentAppId, setCurrentAppId] = useState(null);
  const [resetKey, setResetKey] = useState(Date.now());

  // Automatically go to Home view after login
  useEffect(() => {
    if (user && view !== "home") {
      setView("home");
    }
  }, [user]);

  const switchView = (newView, id = null) => {
    setView(newView);
    setCurrentAppId(id);
    setResetKey(Date.now()); // Used to reset MainApp if needed
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
      {view === "myapps" && <MyApplications setView={switchView} />}
      {view === "dashboard" && <Dashboard />}
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