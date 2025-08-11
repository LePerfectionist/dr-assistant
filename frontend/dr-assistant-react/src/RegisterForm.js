import React, { useState } from "react";
import "./RegisterForm.css";

export default function RegisterForm({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer"); // NEW: Role state
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role); // NEW: Add role to form data

      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg(data.message || "Registered successfully.");
      } else {
        setError(data.detail || "Registration failed");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* NEW: Role selection dropdown */}
        <div className="form-group">
          <label>Role</label>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-select"
          >
            <option value="viewer">Viewer</option>
            <option value="checker">Checker</option>
          </select>
        </div>

        <button type="submit">Register</button>

        {msg && <p className="success-message">{msg}</p>}
        {error && <p className="error-message">{error}</p>}
      </form>

      <p className="switch-text">
        Already have an account?{" "}
        <span className="link" onClick={onSwitch}>
          Login
        </span>
      </p>
    </div>
  );
}