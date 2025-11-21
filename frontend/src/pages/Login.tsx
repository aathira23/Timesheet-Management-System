// src/pages/Login.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setError("");
    setEmailError("");
    setPasswordError("");

    // Validate
    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      valid = false;
    }

    if (!valid) return;

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-content">

            {/* Welcome */}
            <div className="welcome-box">
              <div className="welcome-title">Welcome back</div>
              <div className="welcome-subtitle">
                Log in to your timesheet management system
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form" autoComplete="off">

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); setError(""); }}
                  placeholder="john.doe@company.com"
                  className="form-input form-input-large"
                  autoComplete="off" // disable browser autofill
                />
                {emailError && <div className="inline-error">{emailError}</div>}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(""); setError(""); }}
                  placeholder="Enter your password"
                  className="form-input form-input-large"
                  autoComplete="new-password" // disable browser autofill
                />
                {passwordError && <div className="inline-error">{passwordError}</div>}
              </div>

              <button type="submit" className="login-btn">Login</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
