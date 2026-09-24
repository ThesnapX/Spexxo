// backend/controllers/paymentController.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import { sendMetaEvent } from "../utils/metaCapi.js";

// Initialize Razorpay
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log(
    "✅ Razorpay initialized with key:",
    process.env.RAZORPAY_KEY_ID?.substring(0, 10) + "...",
  );
} catch (error) {
  console.error("❌ Failed to initialize Razorpay:", error.message);
}

// ─────────────────────────────────────────────
// Safe stock helpers
// ─────────────────────────────────────────────
const getSafeStock = (value) => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return Number(value);
};

const validateQuantity = (quantity, productName) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error(
      `Invalid quantity for product "${productName}": ${quantity}. Quantity must be a positive number.`,
    );
  }
  return qty;
};

// ─────────────────────────────────────────────
// Meta Purchase — fired once per order, idempotent
// ─────────────────────────────────────────────
/**
 * Fire Meta Purchase for a paid order (browser + CAPI dedup via purchaseEventId).
 * Must be called AFTER order is confirmed & saved.
 * Never throws — tracking must not block payment flow.
 */
const firePurchaseEvent = async (order, req) => {
  try {
    if (!order) return;

    // Stable idempotent event id, persisted on the order
    if (!order.purchaseEventId) {
      order.purchaseEventId = `purchase_${order._id}_${Date.now()}`;
      order.purchaseTrackedAt = new Date();
      await order.save();
    }

    // Skip if we've already sent the Purchase event in this session
    // (idempotency is enforced by the order itself via purchaseEventId)
    const eventId = order.purchaseEventId;

    const contents = (order.items || []).map((it) => ({
      id: String(it.product?._id || it.product),
      quantity: Number(it.quantity || 1),
      item_price: Number(it.price || 0),
    }));

    const content_ids = contents.map((c) => c.id);
    const num_items = contents.reduce((s, c) => s + c.quantity, 0);

    // user_data — prefer order user, then request user
    const userData = {
      email: order.user?.email,
      phone: order.user?.phone || order.shippingAddress?.phone,
      firstName: order.user?.firstName,
      lastName: order.user?.lastName,
      city: order.shippingAddress?.city,
      state: order.shippingAddress?.state,
      zip: order.shippingAddress?.pincode,
      country: "IN",
      externalId: order.user?._id?.toString(),
      // Attribution (from request cookies/body — Meta will attribute)
      fbc: req?.cookies?._fbc || req?.body?.fbc || null,
      fbp: req?.cookies?._fbp || req?.body?.fbp || null,
      clientIpAddress:
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.socket?.remoteAddress ||
        null,
      clientUserAgent: req?.headers?.["user-agent"] || null,
    };

    const customData = {
      value: Number(order.total || 0),
      currency: "INR",
      content_ids,
      content_type: "product",
      contents,
      num_items,
      order_id: order.orderNumber || String(order._id),
    };

    console.log(
      `[CAPI] Firing Purchase | order=${order.orderNumber} | eventId=${eventId}`,
    );

    await sendMetaEvent({
      eventName: "Purchase",
      eventId,
      userData,
      customData,
      eventSourceUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/account/orders/${order._id}`
        : undefined,
    });
  } catch (err) {
    // Never let tracking break the payment flow
    console.error("[CAPI] Purchase fire error (non-fatal):", err.message);
  }
};

// ─────────────────────────────────────────────
// Confirm order and reduce stock
// ─────────────────────────────────────────────
const confirmOrderAndReduceStock = async (orderId, paymentId, req) => {
  console.log("[PAYMENT] Confirming order and reducing stock:", orderId);

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.orderStatus === "confirmed") {
    console.log("[PAYMENT] Order already confirmed — Purchase may have fired");
    // Still attempt Purchase (idempotent — same eventId)
    await firePurchaseEvent(
      await Order.findById(orderId)
        .populate("user", "firstName lastName email phone")
        .populate("items.product", "name slug images sku"),
      req,
    );
    return order;
  }

  // Step 1: reduce stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const quantity = validateQuantity(item.quantity, product.name);

    if (item.variant && product.variants && product.variants.length > 0) {
      const variantIndex = product.variants.findIndex(
        (v) =>
          v._id?.toString() === item.variant._id?.toString() ||
          v.name === item.variant.name ||
          v.sku === item.variant.sku,
      );
      if (variantIndex === -1) continue;

      const currentVariantStock = getSafeStock(
        product.variants[variantIndex].stock,
      );
      if (currentVariantStock < quantity) {
        throw new Error(
          `Not enough stock for variant ${product.variants[variantIndex].name}.`,
        );
      }
      product.variants[variantIndex].stock = currentVariantStock - quantity;

      if (product.productType === "variable") {
        let totalStock = 0;
        product.variants.forEach((v) => {
          totalStock += getSafeStock(v.stock);
        });
        product.stock = totalStock;
      }
      product.markModified("variants");
      await product.save();
    } else {
      const currentStock = getSafeStock(product.stock);
      if (currentStock < quantity) {
        throw new Error(`Not enough stock for ${product.name}.`);
      }
      product.stock = currentStock - quantity;
      await product.save();
    }
  }

  // Step 2: confirm order
  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.statusHistory.push({
    status: "confirmed",
    note: `Payment verified. Payment ID: ${paymentId}`,
    date: new Date(),
  });
  await order.save();

  // Step 3: clear cart
  await Cart.findOneAndUpdate(
    { user: order.user },
    { items: [] },
    { new: true },
  );

  // Step 4: reload populated order for Purchase tracking
  const populatedOrder = await Order.findById(order._id)
    .populate("items.product", "name slug images sku variants")
    .populate("user", "firstName lastName email phone customerId");

  // Step 5: fire Purchase (idempotent, non-blocking — but awaited here
  //         so the eventId is guaranteed persisted before response)
  await firePurchaseEvent(populatedOrder, req);

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

    let amountToCharge = order.total;
    if (order.isCOD && order.codAdvance > 0) {
      amountToCharge = order.codAdvance;
    } else if (order.isCOD && !order.codAdvance) {
      return res.status(400).json({
        success: false,
        message: "COD without advance does not require payment",
      });
    }

    if (amountToCharge <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Payment amount is zero." });
    }

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured.",
      });
    }

    const productNames = order.items.map((item) => item.name).join(", ");
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
// Verify Razorpay payment
// ─────────────────────────────────────────────
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
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
      // Idempotent — Purchase already fired when first confirmed
      return res.status(200).json({
        success: true,
        message: "Order already paid",
        order: order,
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
    console.error("[PAYMENT] Payment verification error:", error.message);
    res.status(500).json({
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
// Verify COD advance payment
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

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
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
      return res.status(200).json({
        success: true,
        message: "Order already paid",
        order: order,
      });
    }

    if (!isCODAdvance) {
      return res.status(400).json({
        success: false,
        message: "Invalid COD advance request",
      });
    }

    const populatedOrder = await confirmOrderAndReduceStock(
      orderId,
      razorpay_payment_id,
      req,
    );

    populatedOrder.codAdvance =
      populatedOrder.codAdvance || Math.round(populatedOrder.total * 0.1);
    populatedOrder.remainingCOD =
      populatedOrder.total - populatedOrder.codAdvance;
    await populatedOrder.save();

    res.status(200).json({
      success: true,
      message: "COD advance payment verified and order confirmed",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("[PAYMENT] COD advance verification error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};
