// import React, { useState } from "react";
// import "./App.css"; // For consistent styling

// export default function RegisterForm({ onSwitch }) {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     try {
//       const response = await fetch("http://localhost:8000/api/v1/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: new URLSearchParams(form),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data.detail || "Registration failed. Email may already be registered.");
//       } else {
//         setSuccess(data.message || "Registration successful.");
//       }
//     } catch (err) {
//       console.error("Registration error:", err);
//       setError("Something went wrong during registration.");
//     }
//   };

//   return (
//     <div className="auth-form-container">
//       <h2>Register</h2>
//       <form onSubmit={handleSubmit} className="auth-form">
//         <input
//           type="text"
//           name="name"
//           placeholder="Full Name"
//           value={form.name}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           value={form.email}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           value={form.password}
//           onChange={handleChange}
//           required
//         />
//         <button type="submit">Register</button>
//       </form>
//       {error && <p className="auth-error">{error}</p>}
//       {success && <p className="auth-success">{success}</p>}
//       <p>
//         Already have an account?{" "}
//         <button className="switch-btn" onClick={onSwitch}>
//           Login
//         </button>
//       </p>
//     </div>
//   );
// }
import React, { useState } from "react";

export default function RegisterForm({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      const data = await res.json();
      if (res.ok) {
        setMsg(data.message || "Registered successfully.");
      } else {
        setError(data.detail || "Registration failed");
      }
    } catch {
      setError("Something went wrong");
    }
  };

  return (
    <div className="auth-box">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
        <p>Already have an account? <span className="switch-link" onClick={onSwitch}>Login</span></p>
        {msg && <p className="success">{msg}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
