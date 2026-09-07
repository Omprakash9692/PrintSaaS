import express from "express";
import { createOrder,getShopOrders,updateOrderStatus,getOrderForPrint} from "../controllers/orderController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/shop/:shopCode",
    upload.single("document"),
    createOrder
);

router.get("/shop",protect,getShopOrders);

router.patch("/:orderId/status",protect,updateOrderStatus);

router.get("/:orderId/print",protect,getOrderForPrint);

export default router;