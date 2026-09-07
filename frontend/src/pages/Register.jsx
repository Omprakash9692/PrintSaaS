import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_URL from "../services/api";
import Navbar from "../components/Navbar";
import {
  Check,
  Mail,
  Lock,
  User,
  Store,
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: form.shopName,
          ownerName: form.ownerName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Redirect to login after successful registration
      navigate("/login", {
        state: { registered: true, shopName: data.shop?.shopName },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    pointerEvents: "none",
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="login-split-container">
          {/* Left Side: Brand Pitch */}
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
              <span>START YOUR PRINT SHOP FOR FREE</span>
            </div>

            <h1 className="pitch-headline">
              Your shop. Your queue.{" "}
              <span style={{ color: "#38bdf8" }}>Zero WhatsApp.</span>
            </h1>
            <p className="pitch-subtitle">
              Register in under a minute and get a dedicated shop link + QR code
              your customers can use to submit print jobs instantly.
            </p>

            <div className="benefit-list">
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={16} />
                </div>
                <span>Unique shop code &amp; QR generated instantly</span>
              </div>
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={16} />
                </div>
                <span>No phone number ever shared with customers</span>
              </div>
              <div className="benefit-item">
                <div className="benefit-check">
                  <Check size={16} />
                </div>
                <span>Files auto-deleted after printing for privacy</span>
              </div>
            </div>
          </div>

          {/* Right Side: Register Card */}
          <div>
            <div className="saas-card" style={{ padding: "2.25rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>
                  Create Your Shop
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Register as a print shop owner — it's free
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  style={{
                    background: "var(--danger-bg)",
                    border: "1px solid var(--danger-border)",
                    color: "var(--danger-text)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Shop Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-shopName">
                    Shop Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <Store size={18} style={iconStyle} />
                    <input
                      id="reg-shopName"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem" }}
                      type="text"
                      name="shopName"
                      placeholder="e.g. City Print House"
                      value={form.shopName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Owner Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-ownerName">
                    Your Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={18} style={iconStyle} />
                    <input
                      id="reg-ownerName"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem" }}
                      type="text"
                      name="ownerName"
                      placeholder="Full name"
                      value={form.ownerName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={iconStyle} />
                    <input
                      id="reg-email"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem" }}
                      type="email"
                      name="email"
                      placeholder="owner@printshop.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={iconStyle} />
                    <input
                      id="reg-password"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ marginBottom: "1.75rem" }}>
                  <label className="form-label" htmlFor="reg-confirmPassword">
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={iconStyle} />
                    <input
                      id="reg-confirmPassword"
                      className="form-input"
                      style={{ paddingLeft: "2.5rem", paddingRight: "2.75rem" }}
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                      }}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="register-submit-btn"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    "Creating your shop..."
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create My Shop
                    </>
                  )}
                </button>
              </form>

              {/* Link to Login */}
              <div
                style={{
                  marginTop: "1.75rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-color)",
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                Already have a shop?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "var(--primary)",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  Login here →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
