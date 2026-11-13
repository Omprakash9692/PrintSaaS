import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

let instance = null;

export const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("your_") &&
    !keySecret.includes("your_") &&
    keyId.trim().length > 0 &&
    keySecret.trim().length > 0
  );
};

export const getRazorpayInstance = () => {
  if (!isRazorpayConfigured()) {
    return null;
  }

  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }

  return instance;
};

export const getRazorpayKeyId = () => {
  return process.env.RAZORPAY_KEY_ID?.trim() || "";
};

