import React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";

const NotFound = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="saas-card empty-state" style={{ maxWidth: "480px", width: "100%" }}>
          <div className="empty-state-icon">
            <FileQuestion size={32} />
          </div>
          <h2 className="empty-state-title">Page Not Found</h2>
          <p className="empty-state-subtitle" style={{ marginBottom: "1.5rem" }}>
            The page or print shop link you are looking for does not exist or has been moved.
          </p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
            <ArrowLeft size={18} />
            Go to Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
