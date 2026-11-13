import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API_URL from "../services/api";
import Navbar from "../components/Navbar";
import {
  Upload,
  FileText,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  AlertCircle,
  Copy,
  Check,
  Store,
  Printer,
  FileCheck,
  CreditCard,
  ShieldCheck,
  IndianRupee,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

const CustomerShop = () => {
  const { shopCode } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [order, setOrder] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [file, setFile] = useState(null);
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState("B/W");
  const [sides, setSides] = useState("SINGLE");
  const [paperSize, setPaperSize] = useState("A4");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const cleanCode = shopCode ? shopCode.trim() : "";
        const response = await fetch(`${API_URL}/shops/${encodeURIComponent(cleanCode)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load shop details");
        }

        setShop(data.shop);

        if (data.shop?.shopCode && shopCode !== data.shop.shopCode) {
          navigate(`/shop/${data.shop.shopCode}`, { replace: true });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopCode, navigate]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a PDF document");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("document", file);
    formData.append("copies", copies);
    formData.append("colorMode", colorMode);
    formData.append("sides", sides);
    formData.append("paperSize", paperSize);

    try {
      const cleanCode = shopCode ? shopCode.trim() : "";
      const response = await fetch(`${API_URL}/orders/shop/${encodeURIComponent(cleanCode)}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      setPendingPayment({
        order: data.order,
        payment: data.payment,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async (paymentData) => {
    try {
      setIsVerifying(true);
      const targetOrderId = pendingPayment.order.orderId;
      const response = await fetch(`${API_URL}/orders/${targetOrderId}/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment verification failed");
      }

      setOrder(data.order);
      setPendingPayment(null);
    } catch (err) {
      alert("Verification Error: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!pendingPayment || !pendingPayment.payment) return;

    const { payment, order: currentOrder } = pendingPayment;

    // If mock/sandbox mode is requested or keys are not provided
    if (payment.isMock) {
      await handleVerifyPayment({
        isMock: true,
        razorpay_order_id: payment.razorpayOrderId,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
      });
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert("Could not load payment gateway SDK. Please check your internet connection.");
      return;
    }

    const options = {
      key: payment.keyId,
      amount: payment.amountPaise,
      currency: payment.currency || "INR",
      name: shop?.shopName || "PrintSaaS",
      description: `Print Order ${currentOrder.orderId}`,
      order_id: payment.razorpayOrderId,
      handler: async function (response) {
        await handleVerifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          isMock: false,
        });
      },
      prefill: {
        name: "Customer",
        email: "",
        contact: "",
      },
      theme: {
        color: "#2563eb",
      },
    };

    try {
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        alert("Payment failed: " + (response.error?.description || "Unknown error"));
      });
      razorpayInstance.open();
    } catch (rzpErr) {
      console.error(rzpErr);
      alert("Failed to open payment gateway: " + rzpErr.message);
    }
  };

  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="saas-card" style={{ textAlign: "center", padding: "3rem", width: "100%", maxWidth: "420px" }}>
            <div className="upload-icon-circle" style={{ animation: "pulse 1.5s infinite" }}>
              <Store size={28} />
            </div>
            <h3 style={{ color: "var(--text-main)", marginBottom: "0.5rem" }}>Loading shop details...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Connecting to secure print server</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="saas-card" style={{ textAlign: "center", padding: "3rem", width: "100%", maxWidth: "450px" }}>
            <div className="empty-state-icon" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger-text)" }}>
              <AlertCircle size={32} />
            </div>
            <h2 className="empty-state-title" style={{ color: "var(--danger-text)" }}>Shop Not Found</h2>
            <p className="empty-state-subtitle" style={{ marginBottom: "1.5rem" }}>
              {error}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Please check the shop URL or scan the shop's QR code again.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // State 1: Payment Checkout Screen (Before Print Starts)
  if (pendingPayment) {
    const { order: pendingOrder, payment } = pendingPayment;
    const pages = pendingOrder.pricing?.pages || 1;
    const rate = pendingOrder.pricing?.ratePerPage || 2;
    const totalAmount = pendingOrder.pricing?.totalAmount || payment.amount;

    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="confirmation-container" style={{ maxWidth: "520px" }}>
            <div className="saas-card" style={{ padding: "2.25rem 2rem" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CreditCard size={32} />
                </div>
              </div>

              <h1 style={{ fontSize: "1.65rem", marginBottom: "0.35rem", textAlign: "center" }}>
                Complete Payment
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.925rem", textAlign: "center", marginBottom: "1.75rem" }}>
                Payment is required before your document is printed at <strong>{shop?.shopName}</strong>.
              </p>

              {/* Order & Price Summary Card */}
              <div
                style={{
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  marginBottom: "1.75rem",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Document:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)", maxWidth: "220px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {pendingOrder.filename}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Detected Pages:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    {pages} {pages === 1 ? "page" : "pages"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Print Options:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    {pendingOrder.copies} {pendingOrder.copies === 1 ? "copy" : "copies"} • {pendingOrder.colorMode} • {pendingOrder.paperSize}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Rate per page:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    ₹{rate} / page
                  </span>
                </div>

                <div
                  style={{
                    borderTop: "1px dashed var(--border-color)",
                    paddingTop: "0.75rem",
                    marginTop: "0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: "700", fontSize: "1.05rem", color: "var(--text-main)" }}>
                    Total Amount:
                  </span>
                  <span style={{ fontWeight: "800", fontSize: "1.4rem", color: "var(--primary)" }}>
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleRazorpayPayment}
                  disabled={isVerifying}
                  style={{ width: "100%", justifyContent: "center", fontSize: "1.05rem", padding: "0.85rem" }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={18} className="spin-icon" />
                      Verifying Payment...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} />
                      Pay ₹{totalAmount} & Start Printing
                    </>
                  )}
                </button>

                {/* Demo / Sandbox Payment Button for easy testing without keys */}
                {payment.isMock && (
                  <div style={{ textAlign: "center", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                      💡 Razorpay test keys not configured yet. You can test with simulated instant payment:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment({ isMock: true, razorpay_order_id: payment.razorpayOrderId })}
                      className="btn-secondary"
                      disabled={isVerifying}
                      style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", width: "100%", justifyContent: "center" }}
                    >
                      Instant Test Payment (Mock ₹{totalAmount})
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPendingPayment(null)}
                  className="btn-secondary"
                  disabled={isVerifying}
                  style={{ width: "100%", justifyContent: "center", fontSize: "0.9rem" }}
                >
                  <ArrowLeft size={16} />
                  Change Print Options
                </button>
              </div>

              <div className="privacy-notice" style={{ textAlign: "left", marginTop: "1rem" }}>
                <Lock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong>Safe & Direct:</strong> Document will only be sent to the physical printer after payment is confirmed.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // State 2: Order Placed & Payment Confirmed
  if (order) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="confirmation-container">
            <div className="saas-card" style={{ padding: "2.5rem 1.75rem" }}>
              <div className="success-badge-icon">
                <CheckCircle2 size={44} />
              </div>

              <h1 style={{ fontSize: "1.875rem", marginBottom: "0.375rem" }}>Payment Successful!</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.975rem" }}>
                Your payment of <strong>₹{order.pricing?.totalAmount || 0}</strong> was verified. Your document is now queued for printing at <strong>{shop?.shopName || "the print shop"}</strong>.
              </p>

              <div style={{ margin: "1.75rem 0" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "700" }}>
                  Your Counter Order ID
                </p>
                <div
                  className="order-id-highlight"
                  onClick={() => handleCopyOrderId(order.orderId)}
                  title="Click to copy Order ID"
                  style={{ cursor: "pointer" }}
                >
                  {order.orderId}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderId(order.orderId)}
                    className="btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                  >
                    {copiedId ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
                    {copiedId ? "Copied to clipboard!" : "Copy Order ID"}
                  </button>
                </div>
              </div>

              <p style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                Please show this Order ID at the counter to collect your prints.
              </p>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setOrder(null);
                  setFile(null);
                }}
              >
                <Plus size={18} />
                Place Another Order
              </button>

              <div className="privacy-notice" style={{ marginTop: "1.75rem", textAlign: "left" }}>
                <Lock size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>
                  <strong>Privacy Note:</strong> Your document is temporarily stored for printing and is deleted after the print workflow completes.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // State 3: Upload Form Page
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="customer-page-container">
          {/* Shop Header Banner */}
          <div className="saas-card shop-header-card">
            <div className="shop-avatar-icon">
              <Store size={28} />
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              <span>VERIFIED PRINT SHOP</span>
            </div>
            <h1 className="shop-header-title">{shop?.shopName}</h1>
            <p className="shop-header-subtitle">
              Send your document securely to this print shop without sharing personal numbers.
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="saas-card">
            {/* Upload PDF Section */}
            <div style={{ marginBottom: "1.75rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} style={{ color: "var(--primary)" }} />
                Upload PDF Document
              </h3>

              <div
                className={`upload-dropzone ${file ? "has-file" : ""}`}
                onClick={() => document.getElementById("pdf-file-input").click()}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files[0])}
                />

                <div className="upload-icon-circle">
                  <Upload size={26} />
                </div>
                <div className="upload-title">
                  {file ? "Change PDF Document" : "Select PDF Document"}
                </div>
                <div className="upload-subtitle">
                  Supports PDF files up to 25MB
                </div>

                <button type="button" className="btn-upload-trigger">
                  <FileCheck size={16} />
                  {file ? "Choose Different PDF" : "Choose PDF"}
                </button>
              </div>

              {/* Selected File Feedback */}
              {file && (
                <div className="selected-file-box">
                  <div className="file-info-group">
                    <div className="file-icon-badge">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <span className="badge badge-completed">Selected</span>
                </div>
              )}
            </div>

            {/* Print Options */}
            <div style={{ borderTop: "2px solid var(--border-color)", paddingTop: "1.5rem", marginBottom: "1.75rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1.25rem", color: "var(--text-main)" }}>
                Print Options
              </h3>

              {/* Copies Stepper */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div className="option-section-title">Number of Copies</div>
                <div className="stepper-control">
                  <button
                    type="button"
                    className="btn-stepper"
                    disabled={Number(copies) <= 1}
                    onClick={() => setCopies(Math.max(1, Number(copies) - 1))}
                  >
                    <Minus size={18} />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="stepper-input"
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                  />

                  <button
                    type="button"
                    className="btn-stepper"
                    disabled={Number(copies) >= 100}
                    onClick={() => setCopies(Number(copies) + 1)}
                  >
                    <Plus size={18} />
                  </button>

                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-secondary)", marginLeft: "0.25rem" }}>
                    {Number(copies) === 1 ? "copy" : "copies"}
                  </span>
                </div>
              </div>

              {/* Color Mode */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div className="option-section-title">Color Mode</div>
                <div className="pill-group">
                  <label className={`pill-option ${colorMode === "B/W" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="colorMode"
                      value="B/W"
                      checked={colorMode === "B/W"}
                      onChange={(e) => setColorMode(e.target.value)}
                    />
                    <span style={{ marginRight: "0.5rem", fontWeight: "800" }}>
                      {colorMode === "B/W" ? "●" : "○"}
                    </span>
                    Black & White (₹2 / page)
                  </label>
                  <label className={`pill-option ${colorMode === "COLOR" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="colorMode"
                      value="COLOR"
                      checked={colorMode === "COLOR"}
                      onChange={(e) => setColorMode(e.target.value)}
                    />
                    <span style={{ marginRight: "0.5rem", fontWeight: "800" }}>
                      {colorMode === "COLOR" ? "●" : "○"}
                    </span>
                    Full Color (₹10 / page)
                  </label>
                </div>
              </div>

              {/* Print Sides */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div className="option-section-title">Print Sides</div>
                <div className="pill-group">
                  <label className={`pill-option ${sides === "SINGLE" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="sides"
                      value="SINGLE"
                      checked={sides === "SINGLE"}
                      onChange={(e) => setSides(e.target.value)}
                    />
                    <span style={{ marginRight: "0.5rem", fontWeight: "800" }}>
                      {sides === "SINGLE" ? "●" : "○"}
                    </span>
                    Single Sided
                  </label>
                  <label className={`pill-option ${sides === "DOUBLE" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="sides"
                      value="DOUBLE"
                      checked={sides === "DOUBLE"}
                      onChange={(e) => setSides(e.target.value)}
                    />
                    <span style={{ marginRight: "0.5rem", fontWeight: "800" }}>
                      {sides === "DOUBLE" ? "●" : "○"}
                    </span>
                    Double Sided (Duplex)
                  </label>
                </div>
              </div>

              {/* Paper Size */}
              <div style={{ marginBottom: "1.75rem" }}>
                <div className="option-section-title">Paper Size</div>
                <div className="pill-group">
                  <label className={`pill-option ${paperSize === "A4" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paperSize"
                      value="A4"
                      checked={paperSize === "A4"}
                      onChange={(e) => setPaperSize(e.target.value)}
                    />
                    <span style={{ marginRight: "0.5rem", fontWeight: "800" }}>
                      {paperSize === "A4" ? "●" : "○"}
                    </span>
                    A4 (Standard)
                  </label>
                  <label className={`pill-option ${paperSize === "A3" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paperSize"
                      value="A3"
                      checked={paperSize === "A3"}
                      onChange={(e) => setPaperSize(e.target.value)}
                    />
                    <span style={{ marginRight: "0.5rem", fontWeight: "800" }}>
                      {paperSize === "A3" ? "●" : "○"}
                    </span>
                    A3 (Large)
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  Calculating cost & preparing payment...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Proceed to Payment
                </>
              )}
            </button>

            {/* Privacy Note */}
            <div className="privacy-notice">
              <Lock size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Pay before print:</strong> Once paid, your print job will be safely sent to the counter printer and your document automatically removed after printing.
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomerShop;
