import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import "./LoginForm.css";
function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        login(data.access_token);
      } else {
        setError(data.detail || "Login failed");
      }
    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <p onClick={onSwitch}>Don't have an account? Register</p>
    </div>
  );
}

export default LoginForm;
// LoginForm.js

