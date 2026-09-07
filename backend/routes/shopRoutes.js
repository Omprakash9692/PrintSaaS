import express from "express";
import { getShop } from "../controllers/shopController.js";

const router = express.Router();

router.get("/:shopCode", getShop);

export default router;