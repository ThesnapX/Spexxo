import express from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  updateOrder,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getOrders);
router.get("/:id", protect, getOrder);
router.put("/:id/cancel", protect, cancelOrder);

// Admin routes
router.get("/admin/all", protect, admin, getAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.put("/:id", protect, admin, updateOrder);

export default router;
