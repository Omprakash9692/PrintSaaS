import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../services/api";
import Navbar from "../components/Navbar";
import { Check, Mail, Lock, LogIn, ShieldCheck, FileCheck, Layers } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("token", data.token);
      if (data.shop?.shopCode) {
        localStorage.setItem("shopCode", data.shop.shopCode);
      }
      if (data.shop?.shopName) {
        localStorage.setItem("shopName", data.shop.shopName);
      }
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="login-split-container">
          {/* Left Side: Brand Pitch & Benefits */}
          <div className="brand-pitch-card">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(8px)",
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.8rem",
                fontWeight: "700",
                color: "#a5b4fc",
                marginBottom: "1.25rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <ShieldCheck size={16} style={{ color: "#38bdf8" }} />
              <span>PRIVACY-FIRST PRINTING SAAS</span>
            </div>

            <h1 className="pitch-headline">
              Manage your print shop <span style={{ color: "#38bdf8" }}>without WhatsApp.</span>
            </h1>
            <p className="pitch-subtitle">
              Eliminate phone number sharing, messy chat threads, and manual printing. PrintSaaS gives your shop a dedicated digital queue.
            </p>

            <div className="benefit-list">
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={16} />
                </div>
                <span>Organized print orders & auto-queue</span>
              </div>

              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={16} />
                </div>
                <span>Secure document workflow & automatic deletion</span>
              </div>

              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={16} />
                </div>
                <span>Simple 1-click browser printing dashboard</span>
              </div>
            </div>
          </div>

          {/* Right Side: Login Card */}
          <div>
            <div className="saas-card" style={{ padding: "2.25rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>Shop Owner Login</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Enter your credentials to access your shop dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={18}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="login-email"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem" }}
                      type="email"
                      placeholder="owner@printshop.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1.75rem" }}>
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={18}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      id="login-password"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem" }}
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    "Authenticating..."
                  ) : (
                    <>
                      <LogIn size={18} />
                      Login to Dashboard
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: "1.75rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-color)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                🔒 Protected by 256-bit encrypted session security
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;