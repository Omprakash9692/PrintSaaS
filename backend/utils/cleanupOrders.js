import fs from "fs";
import Order from "../models/Order.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

export const cleanupOldOrders = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldOrders = await Order.find({
      createdAt: { $lt: twentyFourHoursAgo },
      status: { $ne: "COMPLETED" },
    });

    for (const order of oldOrders) {
      // Clean up Cloudinary asset
      if (order.document?.publicId) {
        await deleteFromCloudinary(order.document.publicId);
        order.document.publicId = null;
        order.document.url = null;
      }

      // Clean up local file if stored locally
      if (order.document?.path) {
        if (fs.existsSync(order.document.path)) {
          fs.unlinkSync(order.document.path);
          console.log(`Deleted old document for ${order.orderId}`);
        }
        order.document.path = null;
      }

      await order.save();
    }
  } catch (error) {
    console.error("Cleanup failed:", error.message);
  }
};
