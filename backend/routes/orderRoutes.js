// backend/routes/orderRoutes.js

import express from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  updateOrder,
  cancelPendingOrder,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/auth.js";
import Order from "../models/Order.js";

const router = express.Router();

// ============ USER ROUTES ============
router.post("/", protect, createOrder);
router.delete("/:id/cancel-pending", protect, cancelPendingOrder);
router.get("/my-orders", protect, getOrders);
router.get("/:id", protect, getOrder);
router.put("/:id/cancel", protect, cancelOrder);

// ============ ADMIN ROUTES ============
router.get("/admin/all", protect, admin, getAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.put("/:id", protect, admin, updateOrder);

// ============ ADMIN REFUND ROUTE ============
router.put("/:id/refund", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "refund_pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not in refund pending state",
      });
    }

    const refundAmount =
      order.refundAmount || order.codAdvance || order.total || 0;

    order.paymentStatus = "refunded";
    order.statusHistory.push({
      status: "refunded",
      note: `Refund of ₹${refundAmount.toLocaleString()} processed successfully`,
      date: new Date(),
    });
    await order.save();

    res.json({
      success: true,
      message: `Refund of ₹${refundAmount.toLocaleString()} marked as completed`,
      order,
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process refund",
    });
  }
});

export default router;
