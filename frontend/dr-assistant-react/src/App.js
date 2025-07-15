// import React, { useState } from "react";
// import { useAuth, AuthProvider } from "./AuthContext";
// import LoginForm from "./LoginForm";
// import RegisterForm from "./RegisterForm";
// import Home from "./Home";
// import Dashboard from "./Dashboard";
// import MainApp from "./MainApp";
// import "./App.css";

// function AppContent() {
//   const { user, logout } = useAuth();
//   const [view, setView] = useState("home");

//   if (!user) {
//     return view === "login"
//       ? <LoginForm onSwitch={() => setView("register")} />
//       : <RegisterForm onSwitch={() => setView("login")} />;
//   }

//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <h1>DR Assistant</h1>
//         <div className="header-actions">
//           <span>Welcome, {user.name} ({user.role})</span>
//           <button onClick={() => setView("home")} disabled={view === "home"}>🏠 Home</button>
//           <button onClick={() => setView("main")} disabled={view === "main"}>🚀 Launch App</button>
//           <button onClick={() => setView("dashboard")} disabled={view === "dashboard"}>📊 Dashboard</button>
//           <button onClick={logout}>🚪 Logout</button>
//         </div>
//       </header>

//       {view === "home" && <Home setView={setView} />}
//       {view === "main" && <MainApp />}
//       {view === "dashboard" && <Dashboard />}
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
import React, { useState } from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Home from "./Home";
import Dashboard from "./Dashboard";
import MainApp from "./MainApp";
import MyApplications from "./MyApplications";
import "./App.css";

function AppContent() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("home");
  const [resetKey, setResetKey] = useState(Date.now()); // Used to reset MainApp

  const switchView = (newView) => {
    setView(newView);
    setResetKey(Date.now()); // Force unmount/mount to reset components
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

      {view === "home" && <Home setView={setView} />}
      {view === "main" && <MainApp key={resetKey} />}
      {view === "myapps" && <MyApplications />}
      {view === "dashboard" && <Dashboard />}
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
