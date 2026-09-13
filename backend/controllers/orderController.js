import Order from "../models/Order.js";
import User from "../models/User.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { uploadToCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

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

    // Handle File Storage (Cloudinary attempt with automatic Local Disk Fallback)
    let cloudinaryResult = null;
    let localFilePath = req.file.path || null;

    if (req.file.buffer) {
      if (isCloudinaryConfigured()) {
        try {
          cloudinaryResult = await uploadToCloudinary(
            req.file.buffer,
            req.file.originalname
          );
        } catch (uploadError) {
          console.warn("⚠️ Cloudinary upload failed (403 restriction or error). Falling back to local storage:", uploadError.message);
        }
      }

      // If Cloudinary is not configured OR if Cloudinary upload failed, save locally
      if (!cloudinaryResult) {
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

    //create order
    const order = await Order.create({
      orderId,
      shopCode: shop.shopCode,
      document: {
        filename: req.file.originalname,
        path: localFilePath,
        url: cloudinaryResult ? cloudinaryResult.secure_url : null,
        publicId: cloudinaryResult ? cloudinaryResult.public_id : null,
        size: req.file.size,
      },
      copies: numberOfCopies,
      colorMode: colorMode || "B/W",
      sides: sides || "SINGLE",
      paperSize: paperSize || "A4",
    });

    res.status(201).json({
      message: "Print order created successfully",
      order: {
        orderId: order.orderId,
        shopCode: order.shopCode,
        filename: order.document.filename,
        copies: order.copies,
        colorMode: order.colorMode,
        sides: order.sides,
        paperSize: order.paperSize,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create order",
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

    const allowedStatuses = ["PENDING", "PRINTING", "COMPLETED", "CANCELLED"];

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
      PENDING: ["PRINTING", "CANCELLED"],
      PRINTING: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change order from ${order.status} to ${status}`,
      });
    }

    order.status = status;

    if (status === "COMPLETED") {
      order.completedAt = new Date();

      if (order.document?.path) {
        if (fs.existsSync(order.document.path)) {
          fs.unlinkSync(order.document.path);
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
