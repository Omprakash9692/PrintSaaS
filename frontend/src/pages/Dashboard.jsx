import React, { useState, useEffect } from "react";
import API_URL from "../services/api";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { QRCodeSVG } from "qrcode.react";
import {
  Clock,
  Printer,
  CheckCircle,
  FileText,
  Copy,
  Layers,
  FileSpreadsheet,
  Inbox,
  RefreshCw,
  Play,
  Check,
  LayoutGrid,
  QrCode,
  X,
  Store,
  ShieldCheck,
} from "lucide-react";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [printingOrderId, setPrintingOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/orders/shop`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders");
      }
      setOrders(data.orders);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const updateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.orderId === orderId
            ? {
              ...order,
              ...data.order,
              document: data.order.document || order.document,
            }
            : order
        )
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePrint = async (orderId) => {
    try {
      setPrintingOrderId(orderId);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/orders/${orderId}/print`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to download document for printing");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.print();
        // Revoke blob URL after a delay to free memory
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        setPrintingOrderId(null);
      };
    } catch (error) {
      alert(error.message);
      setPrintingOrderId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("shopCode");
    localStorage.removeItem("shopName");
    window.location.href = "/login";
  };

  const handlePrintCounterPoster = () => {
    window.print();
  };

  const storedShopCode = localStorage.getItem("shopCode") || "";
  const storedShopName = localStorage.getItem("shopName") || "Print Shop";

  if (loading) {
    return (
      <div className="app-container">
        <Navbar showLogout={true} onLogout={handleLogout} />
        <main className="main-content">
          <div className="saas-card empty-state">
            <div className="empty-state-icon" style={{ animation: "pulse 1.5s infinite" }}>
              <RefreshCw size={28} />
            </div>
            <h3 className="empty-state-title">Loading dashboard orders...</h3>
            <p className="empty-state-subtitle">Fetching incoming customer documents</p>
          </div>
        </main>
      </div>
    );
  }

  const pendingCount = orders.filter((order) => order.status === "PENDING").length;
  const printingCount = orders.filter((order) => order.status === "PRINTING").length;
  const completedCount = orders.filter((order) => order.status === "COMPLETED").length;

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ALL") return true;
    return order.status === activeTab;
  });

  const shopURL = storedShopCode
    ? `${window.location.origin}/shop/${storedShopCode}`
    : `${window.location.origin}`;

  return (
    <div className="app-container">
      <Navbar showLogout={true} onLogout={handleLogout} />

      <main className="main-content">
        {/* Header Title Section */}
        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <h1>{storedShopName} Dashboard</h1>
            <p>
              Shop Code: <strong style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "1rem" }}>{storedShopCode || "N/A"}</strong> | Manage print queue & print files securely.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: "0.875rem" }}
            >
              <QrCode size={16} />
              My Counter QR Code
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              className="btn-secondary"
              disabled={isRefreshing}
              style={{ fontSize: "0.875rem" }}
            >
              <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
              {isRefreshing ? "Refreshing..." : "Refresh Queue"}
            </button>
          </div>
        </div>

        {/* Metric / Summary Cards */}
        <div className="summary-cards-grid">
          <div className="metric-card">
            <div className="metric-info">
              <p>Pending Orders</p>
              <div className="metric-value">{pendingCount}</div>
            </div>
            <div className="metric-icon-box pending">
              <Clock size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <p>Currently Printing</p>
              <div className="metric-value">{printingCount}</div>
            </div>
            <div className="metric-icon-box printing">
              <Printer size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <p>Completed</p>
              <div className="metric-value">{completedCount}</div>
            </div>
            <div className="metric-icon-box completed">
              <CheckCircle size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <p>Total Orders</p>
              <div className="metric-value">{orders.length}</div>
            </div>
            <div className="metric-icon-box total">
              <LayoutGrid size={22} />
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.15rem" }}>Orders Queue</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
          </div>

          <div className="filter-bar">
            <button
              className={`filter-tab ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              All Orders ({orders.length})
            </button>
            <button
              className={`filter-tab ${activeTab === "PENDING" ? "active" : ""}`}
              onClick={() => setActiveTab("PENDING")}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`filter-tab ${activeTab === "PRINTING" ? "active" : ""}`}
              onClick={() => setActiveTab("PRINTING")}
            >
              Printing ({printingCount})
            </button>
            <button
              className={`filter-tab ${activeTab === "COMPLETED" ? "active" : ""}`}
              onClick={() => setActiveTab("COMPLETED")}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Orders List / Cards Grid */}
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={32} />
            </div>
            <h3 className="empty-state-title">
              {activeTab === "ALL" ? "No orders yet" : `No ${activeTab.toLowerCase()} orders`}
            </h3>
            <p className="empty-state-subtitle">
              New customer print orders will appear here automatically when uploaded.
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div
                key={order.orderId}
                className={`order-card ${order.status === "PENDING"
                    ? "pending-card"
                    : order.status === "PRINTING"
                      ? "printing-card"
                      : "completed-card"
                  }`}
              >
                <div>
                  {/* Order Card Header */}
                  <div className="order-card-header">
                    <span className="order-id-badge">{order.orderId}</span>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Document Name */}
                  <div className="order-document-row">
                    <FileText size={20} className="file-icon" />
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {order.document?.filename || "document.pdf"}
                      </div>
                      <div style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
                        PDF Document
                      </div>
                    </div>
                  </div>

                  {/* Print Specifications */}
                  <div className="order-specs-grid">
                    <div className="spec-item">
                      <Copy size={14} style={{ color: "var(--text-muted)" }} />
                      <span>Copies:</span>
                      <span className="spec-value">{order.copies}</span>
                    </div>

                    <div className="spec-item">
                      <FileSpreadsheet size={14} style={{ color: "var(--text-muted)" }} />
                      <span>Color:</span>
                      <span className="spec-value">{order.colorMode}</span>
                    </div>

                    <div className="spec-item">
                      <Layers size={14} style={{ color: "var(--text-muted)" }} />
                      <span>Sides:</span>
                      <span className="spec-value">{order.sides}</span>
                    </div>

                    <div className="spec-item">
                      <FileText size={14} style={{ color: "var(--text-muted)" }} />
                      <span>Paper:</span>
                      <span className="spec-value">{order.paperSize}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="order-card-actions">
                  {order.status === "PENDING" && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                      onClick={() => updateStatus(order.orderId, "PRINTING")}
                    >
                      <Play size={15} />
                      Start Printing
                    </button>
                  )}

                  {order.status === "PRINTING" && (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: "0.875rem", padding: "0.5rem 0.85rem", flex: 1 }}
                        onClick={() => handlePrint(order.orderId)}
                        disabled={printingOrderId === order.orderId}
                      >
                        <Printer size={15} />
                        {printingOrderId === order.orderId ? "Loading PDF..." : "Print Document"}
                      </button>

                      <button
                        type="button"
                        className="btn-success"
                        style={{ fontSize: "0.875rem", padding: "0.5rem 0.85rem" }}
                        onClick={() => updateStatus(order.orderId, "COMPLETED")}
                      >
                        <Check size={15} />
                        Complete
                      </button>

                      {printingOrderId === order.orderId && (
                        <div style={{
                          width: "100%",
                          marginTop: "0.35rem",
                          fontSize: "0.775rem",
                          color: "var(--printing-text)",
                          background: "var(--printing-bg)",
                          border: "1px solid var(--printing-border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.4rem 0.6rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}>
                          🖨️ When the dialog opens, select your <strong>physical printer</strong> — not "Save as PDF"
                        </div>
                      )}
                    </>
                  )}


                  {order.status === "COMPLETED" && (
                    <div
                      style={{
                        width: "100%",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "var(--completed-text)",
                        fontWeight: "600",
                        padding: "0.4rem",
                        backgroundColor: "var(--completed-bg)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <CheckCircle size={15} />
                      Order Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Shop Counter QR Poster Modal */}
      {isQRModalOpen && (
        <div className="modal-backdrop">
          <div className="saas-card modal-content" style={{ maxWidth: "420px", textAlign: "center", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "0.35rem 0.6rem", borderRadius: "50%" }}
                onClick={() => setIsQRModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div className="shop-avatar-icon" style={{ width: "48px", height: "48px", marginBottom: "0.5rem" }}>
                <Store size={22} />
              </div>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "0.25rem" }}>Print Shop Counter QR</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Display or print this QR code at your shop counter for customers to scan.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "1.5rem",
                borderRadius: "var(--radius-md)",
                border: "2px solid var(--primary-border)",
                display: "inline-block",
                marginBottom: "1.25rem",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <QRCodeSVG value={shopURL} size={200} level="H" />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
                Shop Code (encoded in QR)
              </div>
              <div style={{ fontSize: "1rem", fontWeight: "800", color: "var(--primary)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                {storedShopCode || "—"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem", wordBreak: "break-all" }}>
                {shopURL}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handlePrintCounterPoster}
              style={{ fontSize: "0.9rem" }}
            >
              <Printer size={16} />
              Print Counter Poster
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
