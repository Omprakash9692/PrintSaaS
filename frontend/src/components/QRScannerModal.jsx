import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let html5Qrcode = null;
    let isStopped = false;

    const startScanner = async () => {
      setCameraError("");
      setIsScanning(true);
      setScannedResult("");

      try {
        html5Qrcode = new Html5Qrcode("qr-reader-viewport");
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (isStopped) return;
            isStopped = true;
            setScannedResult(decodedText);

            // Clean up camera before triggering redirect
            html5Qrcode
              .stop()
              .then(() => {
                onScanSuccess(decodedText);
              })
              .catch((err) => {
                console.error("Failed to stop scanner", err);
                onScanSuccess(decodedText);
              });
          },
          (errorMessage) => {
            // Ignore scan attempt failures (normal while scanning frames)
          }
        );
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError(
          "Camera access denied or camera unavailable. Please check browser camera permissions."
        );
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isStopped = true;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch((e) => console.log(e));
          }
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="saas-card modal-content" style={{ maxWidth: "480px", width: "90%", padding: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="brand-icon-wrapper" style={{ width: "36px", height: "36px" }}>
              <Camera size={20} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Scan Shop QR Code</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "0.35rem 0.6rem", borderRadius: "50%" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera Viewport Box */}
        <div
          style={{
            position: "relative",
            minHeight: "280px",
            backgroundColor: "#0f172a",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <div id="qr-reader-viewport" style={{ width: "100%", height: "100%" }}></div>

          {scannedResult && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(16, 185, 129, 0.95)",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
                textAlign: "center",
                zIndex: 10,
              }}
            >
              <CheckCircle2 size={48} style={{ marginBottom: "0.5rem" }} />
              <h3 style={{ color: "#ffffff", fontSize: "1.25rem", marginBottom: "0.25rem" }}>
                QR Code Scanned!
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#ecfdf5" }}>Opening shop page...</p>
            </div>
          )}

          {cameraError && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#fecaca" }}>
              <AlertCircle size={36} style={{ margin: "0 auto 0.75rem auto", color: "#ef4444" }} />
              <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>{cameraError}</p>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "0.85rem" }}
                onClick={onClose}
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center" }}>
          Point your device camera at the shop's printed QR code to open the shop automatically.
        </p>
      </div>
    </div>
  );
};

export default QRScannerModal;
