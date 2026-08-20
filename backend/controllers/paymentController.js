// backend/controllers/paymentController.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

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

    // Get product names for notes
    const productNames = order.items.map((item) => item.name).join(", ");

    // Create Razorpay order with proper details
    const amount = Math.round(order.total * 100); // Convert to paise

    // ✅ Use orderNumber as receipt (this is what shows in Razorpay dashboard)
    const receipt = order.orderNumber || `ORD-${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount,
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
      },
    });

    // Save Razorpay order ID to our order
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
        name:
          `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
          "Customer",
        email: order.user?.email || "",
        contact: order.user?.phone || "",
      },
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        products: productNames || "Spexxo Eyewear",
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment initiation failed" });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = "paid";
    order.paymentMethod = "online";
    order.isCOD = false;
    order.orderStatus = "confirmed";
    order.paymentDetails = {
      ...order.paymentDetails,
      transactionId: razorpay_payment_id,
      paymentGateway: "razorpay",
      razorpayOrderId: razorpay_order_id,
    };
    order.statusHistory.push({
      status: "confirmed",
      note: `Payment received via Razorpay. Payment ID: ${razorpay_payment_id}`,
      date: new Date(),
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

// @desc    Get Razorpay API key
// @route   GET /api/payment/key
// @access  Public
export const getRazorpayKey = async (req, res) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

// @desc    Verify COD advance payment
// @route   POST /api/payment/verify-cod-advance
// @access  Private
export const verifyCODAdvance = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      isCODAdvance,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // For COD advance payment
    if (isCODAdvance) {
      order.paymentStatus = "paid";
      order.paymentMethod = "cod";
      order.isCOD = true;
      order.orderStatus = "confirmed";
      order.codAdvance = order.codAdvance || Math.round(order.total * 0.1);
      order.remainingCOD = order.total - order.codAdvance;
      order.paymentDetails = {
        transactionId: razorpay_payment_id,
        paymentGateway: "razorpay",
        razorpayOrderId: razorpay_order_id,
      };
      order.statusHistory.push({
        status: "confirmed",
        note: `10% advance payment (₹${order.codAdvance}) received via Razorpay. Payment ID: ${razorpay_payment_id}`,
        date: new Date(),
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("COD advance verification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};
