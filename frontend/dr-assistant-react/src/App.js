// // import React, { useState, useEffect } from "react";
// // import { useAuth, AuthProvider } from "./AuthContext";
// // import LoginForm from "./LoginForm";
// // import RegisterForm from "./RegisterForm";
// // import Dashboard from "./Dashboard"; // Renamed usage
// // import MainApp from "./MainApp";
// // import MyApplications from "./MyApplications";
// // import AnalysisPage from "./AnalysisPage";
// // import "./App.css";
// // import "./responsive.css";

// // function AppContent() {
// //   const { user, logout } = useAuth();
// //   const [view, setView] = useState("login"); // ✅ Start from login
// //   const [currentAppId, setCurrentAppId] = useState(null);
// //   const [resetKey, setResetKey] = useState(Date.now());

// //   // Go to Dashboard after login
// //   useEffect(() => {
// //     if (user && (view === "login" || view === "register")) {
// //       setView("dashboard");
// //     }
// //   }, [user]);

// //   const switchView = (newView, id = null) => {
// //     setView(newView);
// //     setCurrentAppId(id);
// //     setResetKey(Date.now()); // Used to reset MainApp if needed
// //   };

// //   if (!user) {
// //     return view === "register" ? (
// //       <RegisterForm onSwitch={() => setView("login")} />
// //     ) : (
// //       <LoginForm onSwitch={() => setView("register")} />
// //     );
// //   }

// //   return (
// //     <div className="app-container">
// //       <header className="app-header">
// //         <h1>DR Assistant</h1>
// //         <div className="header-actions">
// //           <span>
// //             Welcome, {user.name} ({user.role})
// //           </span>
// //           <button onClick={() => switchView("dashboard")} disabled={view === "dashboard"}>
// //             🏠 Home
// //           </button>
// //           <button onClick={() => switchView("main")} disabled={view === "main"}>
// //             🚀 New Application
// //           </button>
// //           <button onClick={() => switchView("myapps")} disabled={view === "myapps"}>
// //             📂 My Applications
// //           </button>
// //           <button onClick={logout}>🚪 Logout</button>
// //         </div>
// //       </header>

// //       {view === "dashboard" && <Dashboard />}
// //       {view === "main" && <MainApp key={resetKey} />}
// //       {view === "myapps" && <MyApplications setView={switchView} />}
// //       {view === "analysis" && (
// //         <AnalysisPage applicationId={currentAppId} setView={switchView} />
// //       )}
// //     </div>
// //   );
// // }

// // export default function App() {
// //   return (
// //     <AuthProvider>
// //       <AppContent />
// //     </AuthProvider>
// //   );
// // }
// import React, { useState } from "react";
// import { useAuth, AuthProvider } from "./AuthContext";
// import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import LoginForm from "./LoginForm";
// import RegisterForm from "./RegisterForm";
// import Dashboard from "./Dashboard";
// import MainApp from "./MainApp";
// import MyApplications from "./MyApplications";
// import AnalysisPage from "./AnalysisPage";
// import ViewerDashboard from "./ViewerDashboard";
// import ProtectedRoute from "./ProtectedRoute";
// import "./App.css";
// import "./responsive.css";

// function AppContent() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/register" element={<RegisterForm />} />
//         <Route path="*" element={<LoginForm />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <h1>DR Assistant</h1>
//         <div className="header-actions">
//           <span>
//             Welcome, {user.name} ({user.role})
//           </span>
//           {user.role !== 'viewer' && (
//             <>
//               <button onClick={() => navigate('/dashboard')}>
//                 🏠 Home
//               </button>
//               <button onClick={() => navigate('/new-application')}>
//                 🚀 New Application
//               </button>
//               <button onClick={() => navigate('/my-applications')}>
//                 📂 My Applications
//               </button>
//             </>
//           )}
//           {user.role === 'viewer' && (
//             <button onClick={() => navigate('/viewer-dashboard')}>
//               🏠 Viewer Dashboard
//             </button>
//           )}
//           <button onClick={logout}>🚪 Logout</button>
//         </div>
//       </header>

//       <Routes>
//         {/* Admin/Checker Routes */}
//         <Route path="/dashboard" element={
//           <ProtectedRoute allowedRoles={['admin', 'checker']}>
//             <Dashboard />
//           </ProtectedRoute>
//         } />
        
//         <Route path="/new-application" element={
//           <ProtectedRoute allowedRoles={['admin', 'checker']}>
//             <MainApp />
//           </ProtectedRoute>
//         } />
        
//         <Route path="/my-applications" element={
//           <ProtectedRoute allowedRoles={['admin', 'checker']}>
//             <MyApplications />
//           </ProtectedRoute>
//         } />
        
//         <Route path="/analysis/:appId" element={
//           <ProtectedRoute allowedRoles={['admin', 'checker']}>
//             <AnalysisPage />
//           </ProtectedRoute>
//         } />

//         {/* Viewer Route */}
//         <Route path="/viewer-dashboard" element={
//           <ProtectedRoute allowedRoles={['viewer']}>
//             <ViewerDashboard />
//           </ProtectedRoute>
//         } />

//         {/* Default redirect based on role */}
//         <Route path="*" element={
//           user.role === 'viewer' ? 
//             <Navigate to="/viewer-dashboard" replace /> : 
//             <Navigate to="/dashboard" replace />
//         } />
//       </Routes>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <AppContent />
//       </AuthProvider>
//     </Router>
//   );
// }
import React from "react";
import { useAuth, AuthProvider } from "./AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Dashboard from "./Dashboard";
import MainApp from "./MainApp";
import MyApplications from "./MyApplications";
import AnalysisPage from "./AnalysisPage";
import ViewerDashboard from "./ViewerDashboard";
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";
import "./responsive.css";

function AppContent() {
  const { user } = useAuth();
  const { logout } = useAuth(); // Make sure logout is destructured here
  const navigate = useNavigate();

  // Public routes (login/register) component
  const PublicRoutes = () => (
    <Routes>
      <Route path="/register" element={<RegisterForm onSwitch={() => navigate('/')} />} />
      <Route path="/" element={<LoginForm onSwitch={() => navigate('/register')} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (!user) {
    return <PublicRoutes />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DR Assistant</h1>
        <div className="header-actions">
          <span>
            Welcome, {user.name} ({user.role})
          </span>
          {user.role !== 'viewer' && (
            <>
              <button onClick={() => navigate('/dashboard')}>
                🏠 Home
              </button>
              <button onClick={() => navigate('/new-application')}>
                🚀 New Application
              </button>
              <button onClick={() => navigate('/my-applications')}>
                📂 My Applications
              </button>
            </>
          )}
          {user.role === 'viewer' && (
            <button onClick={() => navigate('/viewer-dashboard')}>
              🏠 Viewer Dashboard
            </button>
          )}
          <button onClick={() => {
            logout();
            navigate('/');
          }}>🚪 Logout</button>
        </div>
      </header>

      <Routes>
        {/* Admin/Checker Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'checker']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/new-application" element={
          <ProtectedRoute allowedRoles={['admin', 'checker']}>
            <MainApp />
          </ProtectedRoute>
        } />
        
        <Route path="/my-applications" element={
          <ProtectedRoute allowedRoles={['admin', 'checker']}>
            <MyApplications />
          </ProtectedRoute>
        } />
        
        <Route path="/analysis/:appId" element={
          <ProtectedRoute allowedRoles={['admin', 'checker']}>
            <AnalysisPage />
          </ProtectedRoute>
        } />

        {/* Viewer Route */}
        <Route path="/viewer-dashboard" element={
          <ProtectedRoute allowedRoles={['viewer']}>
            <ViewerDashboard />
          </ProtectedRoute>
        } />

        {/* Default redirect based on role */}
        <Route path="*" element={
          user.role === 'viewer' ? 
            <Navigate to="/viewer-dashboard" replace /> : 
            <Navigate to="/dashboard" replace />
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}