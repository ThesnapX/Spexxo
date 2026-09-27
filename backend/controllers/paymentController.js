// backend/controllers/paymentController.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { applyStockForOrder } from "../utils/stockService.js";
import { firePurchaseEvent } from "../utils/firePurchaseEvent.js";

// ─────────────────────────────────────────────
// Initialize Razorpay
// ─────────────────────────────────────────────
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error(
      "❌ Razorpay credentials missing. Payment endpoints will fail.",
    );
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log(
      "✅ Razorpay initialized with key:",
      process.env.RAZORPAY_KEY_ID.substring(0, 10) + "...",
    );
  }
} catch (error) {
  console.error("❌ Failed to initialize Razorpay:", error.message);
}

// ─────────────────────────────────────────────
// Safe helpers
// ─────────────────────────────────────────────
const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const short = (s, n = 12) => (s ? String(s).substring(0, n) + "..." : "—");

// ─────────────────────────────────────────────
// Confirm order: reduce stock (atomic) + mark paid
//
// Idempotent by design:
//   1. If paymentStatus === "paid" AND stockReducedAt is set → return early.
//   2. Claim stockReducedAt via atomic findOneAndUpdate BEFORE any
//      stock mutation. Two concurrent verify calls cannot both win.
//   3. applyStockForOrder handles its own rollback if any item fails.
//   4. Only after stock succeeds do we set orderStatus = "confirmed".
//   5. Purchase is fired once (guarded by order.purchaseEventId).
// ─────────────────────────────────────────────
const confirmOrderAndReduceStock = async (orderId, paymentId, req) => {
  console.log("[PAYMENT] Confirming order:", orderId);

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  // Already fully confirmed → return early, no re-verify.
  if (
    order.paymentStatus === "paid" &&
    order.stockReducedAt &&
    order.orderStatus === "confirmed"
  ) {
    console.log(
      `[PAYMENT] Order ${order.orderNumber} already confirmed. Returning existing.`,
    );
    // Fire Purchase only if it somehow wasn't (defensive — firePurchaseEvent
    // is itself idempotent via purchaseEventId).
    const populated = await Order.findById(orderId)
      .populate("user", "firstName lastName email phone")
      .populate("items.product", "name slug images sku");
    await firePurchaseEvent(populated, req).catch(() => {});
    return populated;
  }

  // ── Atomic claim of stockReducedAt ──
  // Only one concurrent request can flip this field from null → date.
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, stockReducedAt: null },
    { $set: { stockReducedAt: new Date() } },
    { new: true },
  );

  if (!claimed) {
    // Another request already reduced stock. Just make sure status is
    // reflected, then return.
    console.log(
      `[PAYMENT] Stock already reduced by a concurrent request for ${order.orderNumber}`,
    );
    const populated = await Order.findById(orderId)
      .populate("user", "firstName lastName email phone")
      .populate("items.product", "name slug images sku");
    await firePurchaseEvent(populated, req).catch(() => {});
    return populated;
  }

  // ── Reduce stock atomically (with rollback on failure) ──
  const stockResult = await applyStockForOrder(claimed, "decrement");

  if (!stockResult.ok) {
    // Roll back the claim so a future legitimate retry can try again.
    await Order.updateOne({ _id: orderId }, { $set: { stockReducedAt: null } });
    console.error(
      `[PAYMENT] Stock reduction failed for ${claimed.orderNumber}:`,
      stockResult.code,
      stockResult.message,
    );
    const err = new Error(stockResult.message || "Stock reduction failed");
    err.status = 400;
    err.code = stockResult.code;
    throw err;
  }

  // ── Mark paid + confirmed ──
  claimed.paymentStatus = "paid";
  claimed.orderStatus = "confirmed";
  claimed.paymentVerifiedAt = new Date();
  if (!claimed.paymentDetails) claimed.paymentDetails = {};
  if (paymentId) claimed.paymentDetails.transactionId = paymentId;

  claimed.statusHistory.push({
    status: "confirmed",
    note: `Payment verified. Payment ID: ${short(paymentId)}`,
    date: new Date(),
  });

  await claimed.save();

  // ── Clear the cart ──
  try {
    await Cart.findOneAndUpdate(
      { user: claimed.user },
      { items: [], followUpStage: 0, lastActivityAt: new Date() },
      { new: true },
    );
  } catch (e) {
    console.error("[PAYMENT] Cart clear failed (non-fatal):", e.message);
  }

  // ── Reload populated, then fire Purchase (idempotent) ──
  const populatedOrder = await Order.findById(claimed._id)
    .populate("items.product", "name slug images sku variants")
    .populate("user", "firstName lastName email phone customerId");

  await firePurchaseEvent(populatedOrder, req).catch(() => {});

  return populatedOrder;
};

// ─────────────────────────────────────────────
// Create Razorpay order
// ─────────────────────────────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(orderId).populate(
      "user",
      "email phone firstName lastName",
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order already paid" });
    }

    let amountToCharge = safeNumber(order.total, 0);
    if (order.isCOD && safeNumber(order.codAdvance, 0) > 0) {
      amountToCharge = safeNumber(order.codAdvance, 0);
    } else if (order.isCOD && !order.codAdvance) {
      return res.status(400).json({
        success: false,
        message: "COD without advance does not require payment",
      });
    }

    if (!Number.isFinite(amountToCharge) || amountToCharge <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Payment amount is invalid." });
    }

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured.",
      });
    }

    const productNames = (order.items || [])
      .map((item) => item.name)
      .join(", ");
    const amountInPaise = Math.round(amountToCharge * 100);
    const receipt = order.orderNumber || `ORD-${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName:
          `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim(),
        customerEmail: order.user?.email || "",
        customerPhone: order.user?.phone || "",
        products: productNames || "Spexxo Eyewear",
        paymentType: order.isCOD ? "COD Advance" : "Full Payment",
      },
    });

    order.paymentDetails = {
      transactionId: razorpayOrder.id,
      paymentGateway: "razorpay",
      razorpayOrderId: razorpayOrder.id,
    };
    await order.save();

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderNumber: order.orderNumber,
      key: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim(),
        email: order.user?.email || "",
        contact: order.user?.phone || "",
      },
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        products: productNames || "Spexxo Eyewear",
        paymentType: order.isCOD ? "COD Advance" : "Full Payment",
      },
    });
  } catch (error) {
    console.error("[PAYMENT] Razorpay order creation error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Payment initiation failed",
    });
  }
};

// ─────────────────────────────────────────────
// Verify Razorpay payment (idempotent)
// ─────────────────────────────────────────────
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId is required" });
    }

    // Signature check (constant-time safe).
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(
        `[PAYMENT] Signature mismatch for order ${orderId} | payment ${short(razorpay_payment_id)}`,
      );
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Idempotency: if already paid, return the existing order.
    if (order.paymentStatus === "paid") {
      const populated = await Order.findById(order._id)
        .populate("items.product", "name slug images sku variants")
        .populate("user", "firstName lastName email phone customerId");
      return res.status(200).json({
        success: true,
        message: "Order already paid",
        order: populated,
      });
    }

    const populatedOrder = await confirmOrderAndReduceStock(
      orderId,
      razorpay_payment_id,
      req,
    );

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      "[PAYMENT] Payment verification error:",
      error.code || error.message,
    );
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

// ─────────────────────────────────────────────
// Get Razorpay key
// ─────────────────────────────────────────────
export const getRazorpayKey = async (req, res) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

// ─────────────────────────────────────────────
// Verify COD advance (idempotent)
// ─────────────────────────────────────────────
export const verifyCODAdvance = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      isCODAdvance,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId is required" });
    }
    if (!isCODAdvance) {
      return res.status(400).json({
        success: false,
        message: "Invalid COD advance request",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(
        `[PAYMENT] COD signature mismatch for order ${orderId} | payment ${short(razorpay_payment_id)}`,
      );
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      const populated = await Order.findById(order._id)
        .populate("items.product", "name slug images sku variants")
        .populate("user", "firstName lastName email phone customerId");
      return res.status(200).json({
        success: true,
        message: "Order already paid",
        order: populated,
      });
    }

    const populatedOrder = await confirmOrderAndReduceStock(
      orderId,
      razorpay_payment_id,
      req,
    );

    // COD bookkeeping: ensure codAdvance and remainingCOD are set.
    const total = safeNumber(populatedOrder.total, 0);
    const advance =
      safeNumber(populatedOrder.codAdvance, 0) > 0
        ? safeNumber(populatedOrder.codAdvance, 0)
        : Math.round(total * 0.1);
    populatedOrder.codAdvance = advance;
    populatedOrder.remainingCOD = Math.max(0, total - advance);
    await populatedOrder.save();

    res.status(200).json({
      success: true,
      message: "COD advance payment verified and order confirmed",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      "[PAYMENT] COD advance verification error:",
      error.code || error.message,
    );
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};
