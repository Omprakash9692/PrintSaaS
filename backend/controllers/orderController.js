import Order from "../models/Order.js";
import User from "../models/User.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { uploadToImageKit, isImageKitConfigured } from "../config/imagekit.js";
import { PDFDocument } from "pdf-lib";
import {
  getRazorpayInstance,
  isRazorpayConfigured,
  getRazorpayKeyId,
} from "../config/razorpay.js";

export const createOrder = async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { copies, colorMode, sides, paperSize } = req.body;

    let cleanParam = shopCode || "";
    try {
      cleanParam = decodeURIComponent(cleanParam);
    } catch (e) {
      // keep raw if decode fails
    }
    cleanParam = cleanParam.trim();

    const escapedParam = cleanParam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flexPattern = escapedParam.replace(/[-_\s]+/g, "[\\s-_]*");

    let shopNameRegex = null;
    try {
      shopNameRegex = new RegExp(`^${flexPattern}$`, "i");
    } catch (e) {
      shopNameRegex = null;
    }

    const queryConditions = [
      { shopCode: cleanParam.toUpperCase() },
      { shopCode: cleanParam },
    ];
    if (shopNameRegex) {
      queryConditions.push({ shopName: shopNameRegex });
    }

    //check shop
    const shop = await User.findOne({ $or: queryConditions });

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    // check file
    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    //validate copies
    const numberOfCopies = Number(copies);

    if (
      !Number.isInteger(numberOfCopies) ||
      numberOfCopies < 1 ||
      numberOfCopies > 100
    ) {
      return res.status(400).json({
        message: "Copies must be between 1 and 100",
      });
    }

    // Determine actual PDF page count
    let pageCount = 1;
    if (req.file.buffer) {
      try {
        const pdfDoc = await PDFDocument.load(req.file.buffer, {
          ignoreEncryption: true,
        });
        pageCount = pdfDoc.getPageCount() || 1;
      } catch (pdfErr) {
        console.warn("⚠️ Could not count PDF pages, defaulting to 1:", pdfErr.message);
        pageCount = 1;
      }
    }

    // Calculate Pricing
    // Standard rates:
    // B/W A4: ₹2 / page | B/W A3: ₹5 / page
    // COLOR A4: ₹10 / page | COLOR A3: ₹20 / page
    const isColor = (colorMode || "B/W").toUpperCase() === "COLOR";
    const isA3 = (paperSize || "A4").toUpperCase() === "A3";

    let ratePerPage = 2;
    if (isColor) {
      ratePerPage = isA3 ? 20 : 10;
    } else {
      ratePerPage = isA3 ? 5 : 2;
    }

    const totalPagesToPrint = pageCount * numberOfCopies;
    const totalAmount = totalPagesToPrint * ratePerPage;

    // Handle File Storage (ImageKit attempt with automatic Local Disk Fallback)
    let imagekitResult = null;
    let localFilePath = req.file.path || null;

    if (req.file.buffer) {
      if (isImageKitConfigured()) {
        try {
          imagekitResult = await uploadToImageKit(
            req.file.buffer,
            req.file.originalname
          );
        } catch (uploadError) {
          console.warn("⚠️ ImageKit upload failed. Falling back to local storage:", uploadError.message);
        }
      }

      // If ImageKit is not configured OR if ImageKit upload failed, save locally
      if (!imagekitResult) {
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const fullLocalPath = path.join(uploadsDir, uniqueFilename);
        fs.writeFileSync(fullLocalPath, req.file.buffer);
        localFilePath = path.join("uploads", uniqueFilename);
        console.log(`📁 Order document saved locally to: ${localFilePath}`);
      }
    }

    // Generate human-friendly order ID
    const orderId =
      "ORD-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    // Create Razorpay Order if configured, otherwise provide mock order for dev/testing
    let razorpayOrderId = null;
    const configured = isRazorpayConfigured();

    if (configured) {
      try {
        const rzp = getRazorpayInstance();
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(totalAmount * 100), // in paise (1 INR = 100 paise)
          currency: "INR",
          receipt: orderId,
          notes: {
            orderId,
            shopCode: shop.shopCode,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.warn("⚠️ Razorpay order creation failed. Falling back to mock order:", rzpErr.message);
        razorpayOrderId = `order_mock_${Date.now()}`;
      }
    } else {
      razorpayOrderId = `order_mock_${Date.now()}`;
    }

    // Create order with PAYMENT_PENDING status - DO NOT print until payment is verified!
    const order = await Order.create({
      orderId,
      shopCode: shop.shopCode,
      document: {
        filename: req.file.originalname,
        path: localFilePath,
        url: imagekitResult ? imagekitResult.url : null,
        fileId: imagekitResult ? imagekitResult.fileId : null,
        publicId: imagekitResult ? imagekitResult.fileId : null,
        size: req.file.size,
      },
      copies: numberOfCopies,
      colorMode: colorMode || "B/W",
      sides: sides || "SINGLE",
      paperSize: paperSize || "A4",
      status: "PAYMENT_PENDING",
      paymentStatus: "UNPAID",
      pricing: {
        pages: pageCount,
        ratePerPage,
        totalAmount,
        currency: "INR",
      },
      paymentDetails: {
        razorpayOrderId,
        paidAt: null,
      },
    });

    res.status(201).json({
      message: "Order created. Please complete payment to proceed with printing.",
      order: {
        orderId: order.orderId,
        shopCode: order.shopCode,
        filename: order.document.filename,
        copies: order.copies,
        colorMode: order.colorMode,
        sides: order.sides,
        paperSize: order.paperSize,
        status: order.status,
        paymentStatus: order.paymentStatus,
        pricing: order.pricing,
        createdAt: order.createdAt,
      },
      payment: {
        razorpayOrderId,
        amount: totalAmount,
        amountPaise: Math.round(totalAmount * 100),
        currency: "INR",
        keyId: getRazorpayKeyId(),
        isMock: !configured || razorpayOrderId.startsWith("order_mock_"),
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Failed to create order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isMock,
    } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        message: "Order already paid",
        order: {
          orderId: order.orderId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          pricing: order.pricing,
        },
      });
    }

    // Verify cryptographic signature if real Razorpay is configured and not mock
    if (isRazorpayConfigured() && !isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET.trim();
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        order.paymentStatus = "FAILED";
        await order.save();
        return res.status(400).json({ message: "Payment verification signature mismatch" });
      }
    }

    // Mark as PAID and transition to PENDING (Only now can the print agent pick it up!)
    order.paymentStatus = "PAID";
    order.status = "PENDING";
    order.paymentDetails = {
      razorpayOrderId: razorpay_order_id || order.paymentDetails?.razorpayOrderId,
      razorpayPaymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
      paidAt: new Date(),
    };

    await order.save();

    console.log(`💰 Order ${order.orderId} PAID successfully (₹${order.pricing?.totalAmount}). Queued for print.`);

    res.status(200).json({
      message: "Payment verified successfully. Order queued for printing.",
      order: {
        orderId: order.orderId,
        shopCode: order.shopCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        pricing: order.pricing,
        paymentDetails: order.paymentDetails,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
    });
  }
};

export const getShopOrders = async (req, res) => {
  try {
    const shopCode = req.user.shopCode;
    const orders = await Order.find(
      { shopCode },
      {
        orderId: 1,
        "document.filename": 1,
        "document.size": 1,
        copies: 1,
        colorMode: 1,
        sides: 1,
        paperSize: 1,
        status: 1,
        paymentStatus: 1,
        pricing: 1,
        paymentDetails: 1,
        completedAt: 1,
        createdAt: 1,
      },
    ).sort({ createdAt: -1 });

    res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "PAYMENT_PENDING",
      "PENDING",
      "PRINTING",
      "COMPLETED",
      "PRINT_FAILED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findOne({
      orderId,
      shopCode: req.user.shopCode,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const validTransitions = {
      PAYMENT_PENDING: ["PENDING", "CANCELLED"],
      PENDING: ["PRINTING", "CANCELLED", "PRINT_FAILED"],
      PRINTING: ["COMPLETED", "PRINT_FAILED", "PENDING"],
      PRINT_FAILED: ["PENDING", "PRINTING", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change order from ${order.status} to ${status}`,
      });
    }

    order.status = status;

    if (status === "COMPLETED") {
      order.completedAt = new Date();

      if (order.document?.path) {
        const absoluteDocPath = path.resolve(process.cwd(), order.document.path);
        if (fs.existsSync(absoluteDocPath)) {
          fs.unlinkSync(absoluteDocPath);
        }
        order.document.path = null;
      }
    }

    await order.save();

    res.status(200).json({
      message: "Order status updated",
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        completedAt: order.completedAt,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update order status",
    });
  }
};

export const getOrderForPrint = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      orderId,
      shopCode: req.user.shopCode,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "PAID") {
      return res.status(403).json({
        message: "Cannot print unpaid document. Customer must complete payment first.",
      });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        message: "Cancelled order cannot be printed",
      });
    }

    if (order.status === "COMPLETED") {
      return res.status(400).json({
        message: "Completed order cannot be printed",
      });
    }

    if (!order.document?.path || !fs.existsSync(order.document.path)) {
      return res.status(404).json({
        message: "Document no longer exists",
      });
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.setHeader("Content-Type", "application/pdf");

    res.sendFile(order.document.path, {
      root: process.cwd(),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to access document",
    });
  }
};
