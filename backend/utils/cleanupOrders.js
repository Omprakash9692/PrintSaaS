import fs from "fs";
import Order from "../models/Order.js";

export const cleanupOldOrders = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldOrders = await Order.find({
      createdAt: { $lt: twentyFourHoursAgo },
      status: { $ne: "COMPLETED" },
    });

    for (const order of oldOrders) {
      if (order.document?.path) {
        if (fs.existsSync(order.document.path)) {
          fs.unlinkSync(order.document.path);

          console.log(`Deleted old document for ${order.orderId}`);
        }

        order.document.path = null;

        await order.save();
      }
    }
  } catch (error) {
    console.error("Cleanup failed:", error.message);
  }
};
