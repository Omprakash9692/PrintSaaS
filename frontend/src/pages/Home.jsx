import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import QRScannerModal from "../components/QRScannerModal";
import { Search, QrCode, ArrowRight, ShieldCheck, Store, LogIn, Camera, Sparkles } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [shopCodeInput, setShopCodeInput] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const extractShopCodeFromInput = (rawInput) => {
    if (!rawInput) return "";
    let str = rawInput.trim();

    // If it's a full URL, extract the /shop/<code> segment
    try {
      if (str.startsWith("http://") || str.startsWith("https://")) {
        const urlObj = new URL(str);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean);
        const shopIdx = pathSegments.indexOf("shop");
        if (shopIdx !== -1 && pathSegments[shopIdx + 1]) {
          return decodeURIComponent(pathSegments[shopIdx + 1]).trim();
        }
        // URL exists but no /shop/ segment — not a valid shop URL
        return "";
      }
    } catch {
      // ignore parse error, treat as plain text
    }

    // If it contains /shop/ as a path fragment
    if (str.includes("/shop/")) {
      const parts = str.split("/shop/");
      if (parts[1]) {
        return decodeURIComponent(parts[1].split("/")[0].split("?")[0].trim());
      }
    }

    // Otherwise treat it as a plain shop code or shop name
    return str.split("?")[0].replace(/\/+$/, "").trim();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const code = extractShopCodeFromInput(shopCodeInput);
    if (!code) {
      alert("Please enter a shop name or shop code");
      return;
    }
    navigate(`/shop/${encodeURIComponent(code)}`);
  };

  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    const code = extractShopCodeFromInput(decodedText);
    if (code) {
      navigate(`/shop/${encodeURIComponent(code)}`);
    } else {
      alert(`Could not extract shop code from: "${decodedText}". Please ask the shop owner for their shop code.`);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div style={{ maxWidth: "780px", margin: "1.5rem auto" }}>
          {/* Hero Section */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--primary-light)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary-hover)",
                padding: "0.4rem 0.95rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.825rem",
                fontWeight: "700",
                marginBottom: "1rem",
              }}
            >
              <ShieldCheck size={16} style={{ color: "#10b981" }} />
              <span>PRIVACY-FIRST DOCUMENT PRINTING</span>
            </div>

            <h1 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.75rem", lineHeight: "1.2" }}>
              Send documents to print shops <span className="gradient-text">without WhatsApp.</span>
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
              Keep your personal phone number private. Upload documents directly to the shop’s secure digital print queue.
            </p>
          </div>

          {/* Search Card */}
          <div className="saas-card" style={{ marginBottom: "2rem", padding: "2.25rem 2rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Store size={20} style={{ color: "var(--primary)" }} />
              Find Your Print Shop
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Enter the Shop Code or Shop ID provided by your local xerox / printing store:
            </p>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                <Search
                  size={20}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "2.75rem", fontSize: "1rem" }}
                  placeholder="Enter shop code (e.g. om-xerox)"
                  value={shopCodeInput}
                  onChange={(e) => setShopCodeInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "auto", minWidth: "140px", padding: "0.85rem 1.5rem" }}
              >
                Go to Shop
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* QR Code Explanation & Live Camera Scanner Trigger Banner */}
          <div
            className="saas-card"
            style={{
              marginBottom: "2rem",
              background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
              border: "1px solid var(--primary-border)",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-md)",
                background: "var(--primary-gradient)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <QrCode size={34} />
            </div>

            <div style={{ flex: 1, minWidth: "240px" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "0.35rem", color: "var(--text-main)" }}>
                Standing at the shop counter?
              </h3>
              <p style={{ fontSize: "0.925rem", color: "var(--text-secondary)", lineHeight: "1.45", marginBottom: "1rem" }}>
                Scan the QR code displayed at the shop counter using your camera to open the shop page instantly.
              </p>

              <button
                type="button"
                className="btn-primary"
                style={{ width: "auto", padding: "0.65rem 1.25rem", fontSize: "0.9rem" }}
                onClick={() => setIsScannerOpen(true)}
              >
                <Camera size={18} />
                Open QR Camera Scanner
              </button>
            </div>
          </div>

          {/* Shop Owner Portal CTA Box */}
          <div
            className="saas-card"
            style={{
              textAlign: "center",
              padding: "2rem",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid var(--border-color)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.375rem" }}>Are you a Print Shop Owner?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Manage your incoming customer orders, print documents in one click, and keep your shop organized.
            </p>

            <Link
              to="/login"
              className="btn-secondary"
              style={{ display: "inline-flex", textDecoration: "none", padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
            >
              <LogIn size={18} />
              Shop Owner Login
            </Link>
          </div>
        </div>
      </main>

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default Home;
