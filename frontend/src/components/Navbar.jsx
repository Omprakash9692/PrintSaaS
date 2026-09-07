import React from "react";
import { Link } from "react-router-dom";
import { Printer, ShieldCheck, LogOut } from "lucide-react";

const Navbar = ({ showLogout, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand-logo">
          <div className="brand-icon-wrapper">
            <Printer size={22} />
          </div>
          <span>PrintSaaS</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="privacy-badge">
            <ShieldCheck size={14} style={{ color: "#10b981" }} />
            <span>Privacy-focused Document Printing</span>
          </div>

          {showLogout && (
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
            >
              <LogOut size={15} />
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
