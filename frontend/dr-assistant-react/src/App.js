import React, { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Dashboard from "./Dashboard"; // Renamed usage
import MainApp from "./MainApp";
import MyApplications from "./MyApplications";
import AnalysisPage from "./AnalysisPage";
import "./App.css";
import "./responsive.css";

function AppContent() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("login"); // ✅ Start from login
  const [currentAppId, setCurrentAppId] = useState(null);
  const [resetKey, setResetKey] = useState(Date.now());

  // Go to Dashboard after login
  useEffect(() => {
    if (user && (view === "login" || view === "register")) {
      setView("dashboard");
    }
  }, [user]);

  const switchView = (newView, id = null) => {
    setView(newView);
    setCurrentAppId(id);
    setResetKey(Date.now()); // Used to reset MainApp if needed
  };

  if (!user) {
    return view === "register" ? (
      <RegisterForm onSwitch={() => setView("login")} />
    ) : (
      <LoginForm onSwitch={() => setView("register")} />
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
          <button onClick={() => switchView("dashboard")} disabled={view === "dashboard"}>
            🏠 Home
          </button>
          <button onClick={() => switchView("main")} disabled={view === "main"}>
            🚀 New Application
          </button>
          <button onClick={() => switchView("myapps")} disabled={view === "myapps"}>
            📂 My Applications
          </button>
          <button onClick={logout}>🚪 Logout</button>
        </div>
      </header>

      {view === "dashboard" && <Dashboard />}
      {view === "main" && <MainApp key={resetKey} />}
      {view === "myapps" && <MyApplications setView={switchView} />}
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
