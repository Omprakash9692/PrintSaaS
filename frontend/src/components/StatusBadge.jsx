import React from "react";
import { Clock, Printer, CheckCircle, AlertCircle } from "lucide-react";

const StatusBadge = ({ status }) => {
  const normalizedStatus = (status || "PENDING").toUpperCase();

  switch (normalizedStatus) {
    case "PAYMENT_PENDING":
      return (
        <span className="badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          <Clock size={13} />
          Payment Pending
        </span>
      );
    case "PENDING":
      return (
        <span className="badge badge-pending">
          <Clock size={13} />
          Pending
        </span>
      );
    case "PRINTING":
      return (
        <span className="badge badge-printing">
          <Printer size={13} />
          Printing
        </span>
      );
    case "COMPLETED":
      return (
        <span className="badge badge-completed">
          <CheckCircle size={13} />
          Completed
        </span>
      );
    default:
      return (
        <span className="badge badge-pending">
          <AlertCircle size={13} />
          {status}
        </span>
      );
  }
};

export default StatusBadge;
