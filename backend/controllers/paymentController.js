// backend/controllers/paymentController.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";

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

// ✅ Helper function to safely get stock value
const getSafeStock = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return 0;
  }
  return Number(value);
};

// ✅ Helper function to validate quantity
const validateQuantity = (quantity, productName) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error(
      `Invalid quantity for product "${productName}": ${quantity}. Quantity must be a positive number.`,
    );
  }
  return qty;
};

// ✅ Helper function to confirm order and reduce stock
const confirmOrderAndReduceStock = async (orderId, paymentId) => {
  console.log("[PAYMENT] Confirming order and reducing stock:", orderId);

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.orderStatus === "confirmed") {
    console.log("[PAYMENT] Order already confirmed");
    return order;
  }

  // ✅ Debug: Log order items to verify quantity is present
  console.log("[ORDER ITEM DEBUG]", JSON.stringify(order.items, null, 2));

  // Step 1: Reduce stock for all items
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      console.error(`[PAYMENT] Product not found: ${item.product}`);
      continue;
    }

    // ✅ Validate quantity
    const quantity = validateQuantity(item.quantity, product.name);

    console.log(`[STOCK DEBUG]`, {
      orderId: order._id,
      productId: product._id,
      productName: product.name,
      rawQuantity: item.quantity,
      quantityType: typeof item.quantity,
      validatedQuantity: quantity,
      currentProductStock: product.stock,
    });

    // ✅ Check if product has variants
    if (item.variant && product.variants && product.variants.length > 0) {
      const variantIndex = product.variants.findIndex(
        (v) =>
          v._id?.toString() === item.variant._id?.toString() ||
          v.name === item.variant.name ||
          v.sku === item.variant.sku,
      );

      if (variantIndex === -1) {
        console.error(`[PAYMENT] Variant not found: ${item.variant.name}`);
        continue;
      }

      // ✅ Get current stock safely
      const currentVariantStock = getSafeStock(
        product.variants[variantIndex].stock,
      );

      console.log(`[PAYMENT] Variant stock before: ${currentVariantStock}`);

      if (currentVariantStock < quantity) {
        throw new Error(
          `Not enough stock for variant ${product.variants[variantIndex].name}. Available: ${currentVariantStock}, Requested: ${quantity}`,
        );
      }

      // ✅ Update variant stock using validated quantity
      product.variants[variantIndex].stock = currentVariantStock - quantity;
      console.log(
        `[PAYMENT] Variant stock after: ${product.variants[variantIndex].stock}`,
      );

      // ✅ Update main stock for variable products
      if (product.productType === "variable") {
        let totalStock = 0;
        product.variants.forEach((v) => {
          totalStock += getSafeStock(v.stock);
        });
        product.stock = totalStock;
        console.log(
          `[PAYMENT] Updated main stock from variants: ${product.stock}`,
        );
      }

      product.markModified("variants");
      await product.save();
    } else {
      // ✅ Simple product - get current stock safely
      const currentStock = getSafeStock(product.stock);

      console.log(`[PAYMENT] Simple product stock before: ${currentStock}`);

      if (currentStock < quantity) {
        throw new Error(
          `Not enough stock for ${product.name}. Available: ${currentStock}, Requested: ${quantity}`,
        );
      }

      // ✅ Update stock using validated quantity
      product.stock = currentStock - quantity;
      console.log(`[PAYMENT] Simple product stock after: ${product.stock}`);

      await product.save();
    }
  }

  // Step 2: Update order status
  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.statusHistory.push({
    status: "confirmed",
    note: `Payment verified. Payment ID: ${paymentId}`,
    date: new Date(),
  });

  await order.save();

  // Step 3: Clear cart
  await Cart.findOneAndUpdate(
    { user: order.user },
    { items: [] },
    { new: true },
  );

  console.log(
    "[PAYMENT] Order confirmed and stock reduced:",
    order.orderNumber,
  );

  // Step 4: Get populated order
  const populatedOrder = await Order.findById(order._id)
    .populate("items.product", "name slug images sku variants")
    .populate("user", "firstName lastName email phone customerId");

  return populatedOrder;
};

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    console.log("[PAYMENT] Creating Razorpay order for orderId:", orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(orderId).populate(
      "user",
      "email phone firstName lastName",
    );

    if (!order) {
      console.log("[PAYMENT] Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("[PAYMENT] Order found:", order.orderNumber);
    console.log("[PAYMENT] Order total:", order.total);

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    if (order.total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order total is zero. No payment required.",
      });
    }

    if (!razorpay) {
      console.error("[PAYMENT] Razorpay not initialized");
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured. Please check API keys.",
      });
    }

    const productNames = order.items.map((item) => item.name).join(", ");
    const amount = Math.round(order.total * 100);
    const receipt = order.orderNumber || `ORD-${Date.now()}`;

    console.log("[PAYMENT] Creating Razorpay order with amount:", amount);

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: receipt,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName:
          `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
          "Customer",
        customerEmail: order.user?.email || "",
        customerPhone: order.user?.phone || "",
        products: productNames || "Spexxo Eyewear",
      },
    });

    console.log("[PAYMENT] Razorpay order created:", razorpayOrder.id);

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
    console.error("[PAYMENT] Razorpay order creation error:", error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.error?.description || "Invalid payment request",
        details: error.error,
      });
    }

    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: "Invalid Razorpay API keys. Please check your configuration.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Payment initiation failed",
      details: error.error || null,
    });
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

    console.log("[PAYMENT] Verifying payment for order:", orderId);
    console.log("[PAYMENT] razorpay_order_id:", razorpay_order_id);
    console.log("[PAYMENT] razorpay_payment_id:", razorpay_payment_id);
    console.log("[PAYMENT] razorpay_signature:", razorpay_signature);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("[PAYMENT] Expected signature:", expectedSignature);

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error(
        "[PAYMENT] Invalid signature - Payment verification failed",
      );
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
        debug: {
          expected: expectedSignature,
          received: razorpay_signature,
        },
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error("[PAYMENT] Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Order already paid",
        order: order,
      });
    }

    console.log("[PAYMENT] Payment verified, confirming order...");

    // ✅ Confirm order and reduce stock
    const populatedOrder = await confirmOrderAndReduceStock(
      orderId,
      razorpay_payment_id,
    );

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("[PAYMENT] Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
      error: error.toString(),
    });
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

    console.log("[PAYMENT] verifyCODAdvance called");
    console.log("[PAYMENT] razorpay_order_id:", razorpay_order_id);
    console.log("[PAYMENT] razorpay_payment_id:", razorpay_payment_id);
    console.log("[PAYMENT] razorpay_signature:", razorpay_signature);
    console.log("[PAYMENT] orderId:", orderId);
    console.log("[PAYMENT] isCODAdvance:", isCODAdvance);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[PAYMENT] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
        received: {
          razorpay_order_id: !!razorpay_order_id,
          razorpay_payment_id: !!razorpay_payment_id,
          razorpay_signature: !!razorpay_signature,
        },
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    console.log("[PAYMENT] Expected signature:", expectedSignature);
    console.log("[PAYMENT] Received signature:", razorpay_signature);

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error("[PAYMENT] Invalid signature for COD advance");
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
        debug: {
          expected: expectedSignature,
          received: razorpay_signature,
        },
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error("[PAYMENT] Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
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

    console.log("[PAYMENT] COD advance verified, confirming order...");

    // ✅ Confirm order and reduce stock
    const populatedOrder = await confirmOrderAndReduceStock(
      orderId,
      razorpay_payment_id,
    );

    // ✅ Store COD advance details
    populatedOrder.codAdvance =
      populatedOrder.codAdvance || Math.round(populatedOrder.total * 0.1);
    populatedOrder.remainingCOD =
      populatedOrder.total - populatedOrder.codAdvance;
    await populatedOrder.save();

    console.log(
      "[PAYMENT] COD advance order confirmed:",
      populatedOrder.orderNumber,
    );

    res.status(200).json({
      success: true,
      message: "COD advance payment verified and order confirmed",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("[PAYMENT] COD advance verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
      error: error.toString(),
    });
  }
};
