// import React, { createContext, useContext, useEffect, useState } from "react";

// // Create the context
// const AuthContext = createContext();

// // Custom hook to use AuthContext in components
// export const useAuth = () => useContext(AuthContext);

// // AuthProvider component to wrap around your app
// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem("token") || "");

//   // Fetch user details once token is available
//   const fetchUser = async (token) => {
//     try {
//       const res = await fetch("http://localhost:8000/api/v1/auth/me", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setUser({ ...data, token }); // include token in user object for convenience
//       } else {
//         logout(); // invalid token
//       }
//     } catch (err) {
//       console.error("Error fetching user:", err);
//       logout();
//     }
//   };

//   // On mount or token change, try to get user details
//   useEffect(() => {
//     if (token) {
//       fetchUser(token);
//     }
//   }, [token]);

//   // Login handler
//   const login = (newToken) => {
//     localStorage.setItem("token", newToken);
//     setToken(newToken);
//     // After successful login:
// navigate(user.role === 'viewer' ? '/viewer-dashboard' : '/dashboard');
//   };

//   // Logout handler
//   const logout = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//     setToken("");
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout }}>
//       {children}
      
//     </AuthContext.Provider>
//   );
// }
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  const fetchUser = async (token) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const userData = { ...data, token };
        setUser(userData);
        // Navigate after setting user
        navigate(userData.role === 'viewer' ? '/viewer-dashboard' : '/dashboard');
      } else {
        logout();
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}