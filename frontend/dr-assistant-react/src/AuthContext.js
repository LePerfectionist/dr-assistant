// import React, { createContext, useContext, useEffect, useState } from "react";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(localStorage.getItem("token") || null);
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     if (token) {
//       fetch("http://localhost:8000/api/v1/auth/me", {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//         .then(res => res.ok ? res.json() : null)
//         .then(data => setUser(data))
//         .catch(() => {
//           setUser(null);
//           setToken(null);
//           localStorage.removeItem("token");
//         });
//     }
//   }, [token]);

//   const login = (token) => {
//     setToken(token);
//     localStorage.setItem("token", token);
//   };

//   const logout = () => {
//     setToken(null);
//     setUser(null);
//     localStorage.removeItem("token");
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

// Create the context
const AuthContext = createContext();

// Custom hook to use AuthContext in components
export const useAuth = () => useContext(AuthContext);

// AuthProvider component to wrap around your app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // Fetch user details once token is available
  const fetchUser = async (token) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, token }); // include token in user object for convenience
      } else {
        logout(); // invalid token
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      logout();
    }
  };

  // On mount or token change, try to get user details
  useEffect(() => {
    if (token) {
      fetchUser(token);
    }
  }, [token]);

  // Login handler
  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken("");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
