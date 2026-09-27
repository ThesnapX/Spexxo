// backend/controllers/orderController.js

import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { orderPlacedEmail, orderStatusEmail } from "../utils/emailTemplates.js";
import { sendTransactionalEmail } from "../utils/emailService.js";
import { firePurchaseEvent } from "../utils/firePurchaseEvent.js";
import {
  applyStockForOrder,
  incrementItemStock,
  findVariantForItem,
} from "../utils/stockService.js";

// ─────────────────────────────────────────────
// Safe numeric helper
// ─────────────────────────────────────────────
const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ─────────────────────────────────────────────
// Resolve authoritative item pricing from DB.
//
// Input: array of { product, variant, quantity }
// Output: { items: [...], subtotal }
//
// The frontend is NEVER trusted for price, name, image, or stock.
// ─────────────────────────────────────────────
const resolveItemsFromDb = async (rawItems) => {
  const resolved = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const productId =
      raw.product && typeof raw.product === "object" && raw.product._id
        ? raw.product._id
        : raw.product;

    if (!productId) {
      const err = new Error("Each item must have a product ID");
      err.status = 400;
      throw err;
    }

    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      const err = new Error(
        `Invalid quantity for product ${productId}. Quantity must be a positive integer.`,
      );
      err.status = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error(`Product not found: ${productId}`);
      err.status = 404;
      throw err;
    }
    if (product.isActive === false) {
      const err = new Error(
        `Product "${product.name}" is currently unavailable`,
      );
      err.status = 400;
      throw err;
    }

    // ── Variant path ──
    if (raw.variant) {
      const matched = findVariantForItem(product, raw.variant);
      if (!matched) {
        const err = new Error(
          `Selected variant not found for "${product.name}"`,
        );
        err.status = 400;
        throw err;
      }
      if (matched.isActive === false) {
        const err = new Error(
          `Variant "${matched.name}" of "${product.name}" is unavailable`,
        );
        err.status = 400;
        throw err;
      }

      const variantStock = Number(matched.stock);
      if (!Number.isFinite(variantStock) || variantStock < quantity) {
        const err = new Error(
          `Only ${Number.isFinite(variantStock) ? variantStock : 0} items available for variant "${matched.name}"`,
        );
        err.status = 400;
        throw err;
      }

      const unitPrice = safeNumber(matched.price, 0);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      const firstImage =
        (matched.images && matched.images[0]?.url) ||
        product.images?.[0]?.url ||
        "";

      resolved.push({
        product: product._id,
        name: product.name,
        image: firstImage,
        price: unitPrice,
        quantity,
        subtotal: lineTotal,
        variant: {
          _id: matched._id || null,
          name: matched.name || "",
          sku: matched.sku || "",
          price: unitPrice,
          color: matched.color || null,
          attributes: matched.attributes || {},
          images: matched.images || [],
        },
      });
      continue;
    }

    // ── Simple path ──
    const productStock = Number(product.stock);
    if (!Number.isFinite(productStock) || productStock < quantity) {
      const err = new Error(
        `Only ${Number.isFinite(productStock) ? productStock : 0} items available for "${product.name}"`,
      );
      err.status = 400;
      throw err;
    }

    const unitPrice = safeNumber(product.comparePrice || product.price, 0);
    const lineTotal = unitPrice * quantity;
    subtotal += lineTotal;

    resolved.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || "",
      price: unitPrice,
      quantity,
      subtotal: lineTotal,
      variant: null,
    });
  }

  return { items: resolved, subtotal };
};

// ─────────────────────────────────────────────
// Apply coupon — server-side only
// ─────────────────────────────────────────────
const computeCouponDiscount = async (couponCode, subtotal, shippingCost) => {
  if (!couponCode) return { discount: 0, couponData: null, coupon: null };

  const coupon = await Coupon.findOne({
    code: String(couponCode).toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  if (!coupon) return { discount: 0, couponData: null, coupon: null };

  if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
    return { discount: 0, couponData: null, coupon: null };
  }

  if (subtotal < safeNumber(coupon.minPurchase, 0)) {
    return { discount: 0, couponData: null, coupon: null };
  }

  let discountBase = subtotal;
  if (coupon.discountOn === "delivery") discountBase = shippingCost;

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (discountBase * safeNumber(coupon.discountValue, 0)) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, safeNumber(coupon.maxDiscount, 0));
    }
  } else {
    discount = Math.min(safeNumber(coupon.discountValue, 0), discountBase);
  }
  discount = Math.max(0, Math.round(discount * 100) / 100);

  return {
    discount,
    couponData: { code: coupon.code, discount },
    coupon,
  };
};

// ─────────────────────────────────────────────
// Shipping cost — server-side authority
// ─────────────────────────────────────────────
// Free above ₹999, else ₹99. If the frontend already told us the
// shipping method selected (basic vs ultra-fast) at a specific price,
// we still recompute a floor — but we honour the *method* the user
// chose, since shipping pricing logic lives in the Shipping module
// and is pre-computed there.
const computeShippingCost = ({ subtotal, chosenShippingCost }) => {
  const chosen = safeNumber(chosenShippingCost, null);
  if (Number.isFinite(chosen) && chosen >= 0) {
    return chosen;
  }
  // Fallback rule.
  return subtotal >= 999 ? 0 : 99;
};

// ─────────────────────────────────────────────
// Create order
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────────
export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      couponCode,
      paymentMethod,
      codAdvance,
      isCOD,
      remainingCOD,
      items,
      // Idempotency hint from the client (optional).
      idempotencyKey,
      // Shipping method info (informational — cost is recomputed).
      shippingMethod,
      shippingMethodName,
      shippingDelivery,
      shippingCost: clientShippingCost,
      pincode,
    } = req.body;

    if (!shippingAddress || !shippingAddress.addressLine1) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // ── Idempotency: same key + same user returns the existing order. ──
    if (idempotencyKey) {
      const existing = await Order.findOne({
        user: req.user._id,
        idempotencyKey,
      })
        .populate("items.product", "name slug images sku variants")
        .populate("user", "firstName lastName email phone customerId");
      if (existing) {
        return res.status(200).json({
          success: true,
          order: existing,
          message: "Order already created",
          idempotent: true,
        });
      }
    }

    // ── Resolve raw items from either the body or the user's cart. ──
    let rawItems = Array.isArray(items) && items.length > 0 ? items : null;

    if (!rawItems) {
      const cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
      );
      if (!cart || !cart.items || cart.items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Cart is empty" });
      }
      rawItems = cart.items.map((ci) => ({
        product: ci.product?._id || ci.product,
        quantity: ci.quantity,
        variant: ci.variant || null,
      }));
    }

    if (!rawItems || rawItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items to order" });
    }

    // ── Server-side price resolution. Frontend is NEVER trusted. ──
    const { items: resolvedItems, subtotal } =
      await resolveItemsFromDb(rawItems);

    // ── Shipping (server authoritative) ──
    const shippingCost = computeShippingCost({
      subtotal,
      chosenShippingCost: clientShippingCost,
    });

    // ── Coupon (server authoritative) ──
    const { discount, couponData, coupon } = await computeCouponDiscount(
      couponCode,
      subtotal,
      shippingCost,
    );

    // ── Totals ──
    const total = Math.max(0, subtotal - discount + shippingCost);

    // ── Instant-confirm? ──
    const isZeroValue = total === 0;
    const isCodNoAdvance = isCOD === true && !codAdvance && total > 0;
    const instantConfirm = isZeroValue || isCodNoAdvance;

    // ── Reserve stock atomically BEFORE creating the order (instant case).
    //    For non-instant orders, stock is reserved at payment verification.
    //    We use a two-phase approach:
    //      Phase A (instant): claim stock, then create order.
    //      Phase B (payment): create pending order, claim stock on verify.
    if (instantConfirm) {
      const probe = {
        items: resolvedItems.map((i) => ({
          product: i.product,
          quantity: i.quantity,
          variant: i.variant,
        })),
      };
      const stockResult = await applyStockForOrder(probe, "decrement");
      if (!stockResult.ok) {
        return res.status(400).json({
          success: false,
          message: stockResult.message || "Stock unavailable",
          code: stockResult.code,
        });
      }
    }

    // ── Build order doc ──
    const orderPayload = {
      user: req.user._id,
      items: resolvedItems,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: instantConfirm ? "paid" : "pending",
      orderStatus: instantConfirm ? "confirmed" : "pending",
      subtotal,
      shippingCost,
      discount,
      coupon: couponData,
      total,
      isCOD: !!isCOD,
      codAdvance: safeNumber(codAdvance, 0),
      remainingCOD: safeNumber(remainingCOD, 0),
      shippingMethod: shippingMethod || null,
      shippingMethodName: shippingMethodName || null,
      shippingDelivery: shippingDelivery || null,
      pincode: pincode || shippingAddress.pincode || null,
      statusHistory: [
        {
          status: instantConfirm ? "confirmed" : "pending",
          note: instantConfirm
            ? isZeroValue
              ? "Free order — auto-confirmed"
              : "COD order (no advance) — auto-confirmed"
            : "Order created, awaiting payment",
          date: new Date(),
        },
      ],
    };

    // If we already claimed stock in Phase A, mark stockReducedAt so
    // verification flow (which never runs for instant orders) doesn't
    // try to decrement again.
    if (instantConfirm) {
      orderPayload.stockReducedAt = new Date();
    }

    // Generate idempotency key if the client didn't send one.
    orderPayload.idempotencyKey =
      idempotencyKey ||
      `auto_${req.user._id}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    let order;
    try {
      order = await Order.create(orderPayload);
    } catch (createErr) {
      // If instant confirm and order creation failed, restore stock.
      if (instantConfirm) {
        await applyStockForOrder(
          {
            items: resolvedItems.map((i) => ({
              product: i.product,
              quantity: i.quantity,
              variant: i.variant,
            })),
          },
          "increment",
        ).catch(() => {});
      }
      // Duplicate idempotency key race — return the existing order.
      if (createErr.code === 11000 && idempotencyKey) {
        const existing = await Order.findOne({
          user: req.user._id,
          idempotencyKey,
        })
          .populate("items.product", "name slug images sku variants")
          .populate("user", "firstName lastName email phone customerId");
        if (existing) {
          return res.status(200).json({
            success: true,
            order: existing,
            message: "Order already created",
            idempotent: true,
          });
        }
      }
      throw createErr;
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name slug images sku variants")
      .populate("user", "firstName lastName email phone customerId");

    // ── Instant-confirm: fire Purchase now. ──
    if (instantConfirm) {
      await firePurchaseEvent(populatedOrder, req).catch(() => {});
    }

    // ── Confirmation email (non-blocking, non-fatal) ──
    try {
      if (populatedOrder.user?.email) {
        const tpl = orderPlacedEmail({
          user: populatedOrder.user,
          order: populatedOrder,
        });
        sendTransactionalEmail({
          to: populatedOrder.user.email,
          subject: tpl.subject,
          html: tpl.html,
          type: "order_placed",
          userId: populatedOrder.user._id,
          refId: populatedOrder._id,
          refType: "order",
        }).catch(() => {});
      }
    } catch (emailErr) {
      console.log("Order placed email failed:", emailErr.message);
    }

    // ── Reset follow-ups ──
    try {
      await User.findByIdAndUpdate(req.user._id, {
        wishlistFollowUpStage: 0,
        wishlistLastActivityAt: new Date(),
      });
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { followUpStage: 0, lastActivityAt: new Date() },
      );
    } catch (resetErr) {
      console.log("Follow-up reset failed:", resetErr.message);
    }

    // ── Coupon usage increment (only after order actually created) ──
    if (coupon) {
      try {
        await Coupon.updateOne(
          { _id: coupon._id },
          {
            $inc: { usedCount: 1 },
            $push: {
              usedBy: { user: req.user._id, count: 1 },
            },
          },
        );
      } catch (couponErr) {
        console.log("Coupon usage increment failed:", couponErr.message);
      }
    }

    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: instantConfirm
        ? "Order confirmed"
        : "Order created, awaiting payment",
    });
  } catch (error) {
    console.error("[ORDER] Create order error:", error.code || error.message);
    res.status(error.status || 400).json({
      success: false,
      message: error.message || "Failed to create order",
      code: error.code,
    });
  }
};

// ─────────────────────────────────────────────
// Cancel a pending order (before payment)
// @route   DELETE /api/orders/:id/cancel-pending
// @access  Private
// ─────────────────────────────────────────────
export const cancelPendingOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.orderStatus !== "pending")
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    if (order.user.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    // If stock was somehow already claimed, restore it.
    if (order.stockReducedAt) {
      await applyStockForOrder(order, "increment").catch((e) =>
        console.error("[ORDER] Stock restore failed:", e.message),
      );
    }

    await Order.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message || "Failed to cancel" });
  }
};

// ─────────────────────────────────────────────
// Get current user's orders
// ─────────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort("-createdAt")
      .populate("items.product", "name slug images sku variants")
      .populate("user", "firstName lastName email phone customerId");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Get single order
// ─────────────────────────────────────────────
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name slug images sku variants")
      .populate(
        "user",
        "firstName lastName email phone customerId username role createdAt",
      );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Cancel order (user or admin)
// ─────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or confirmed orders can be cancelled",
      });
    }
    if (order.orderStatus === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already cancelled" });
    }

    // ── Restore stock if it was reduced. ──
    if (order.stockReducedAt) {
      const restore = await applyStockForOrder(order, "increment");
      if (!restore.ok) {
        console.error(
          "[ORDER] Stock restore failed on cancel:",
          restore.code,
          restore.message,
        );
        // Continue anyway — we do not want to block cancellation.
      }
    }

    // ── Restore coupon usage. ──
    if (order.coupon?.code) {
      try {
        await Coupon.findOneAndUpdate(
          { code: order.coupon.code },
          { $inc: { usedCount: -1 } },
        );
      } catch (e) {
        console.log("Coupon restore failed:", e.message);
      }
    }

    // ── Refund accounting. ──
    let refundAmount = 0;
    let refundNote = "";
    if (safeNumber(order.codAdvance, 0) > 0 && order.paymentStatus === "paid") {
      refundAmount = safeNumber(order.codAdvance, 0);
      refundNote = `Order cancelled. Refund of ₹${refundAmount} (advance) is pending.`;
      order.paymentStatus = "refund_pending";
    } else if (
      order.paymentStatus === "paid" &&
      order.paymentMethod === "online"
    ) {
      refundAmount = safeNumber(order.total, 0);
      refundNote = `Order cancelled. Refund of ₹${refundAmount} is pending.`;
      order.paymentStatus = "refund_pending";
    } else {
      refundNote =
        req.user.role === "admin"
          ? "Cancelled by admin"
          : "Cancelled by customer";
      order.paymentStatus = "pending";
    }

    order.refundAmount = refundAmount;
    order.orderStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: refundNote,
      date: new Date(),
    });
    await order.save();

    res.status(200).json({
      success: true,
      order,
      refundAmount,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Admin: get all orders
// ─────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const query = {};
    if (status) query.orderStatus = status;
    const skip = (safePage - 1) * safeLimit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "firstName lastName email phone customerId")
        .populate("items.product", "name slug images sku variants")
        .sort("-createdAt")
        .skip(skip)
        .limit(safeLimit),
      Order.countDocuments(query),
    ]);
    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Admin: update order status
// ─────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id).populate(
      "user",
      "email firstName lastName phone",
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Order status changed from ${oldStatus} to ${status}`,
      date: new Date(),
    });
    if (status === "delivered" && order.isCOD) {
      order.paymentStatus = "paid";
    }
    await order.save();

    try {
      const userEmail = order.user?.email;
      if (userEmail) {
        const tpl = orderStatusEmail({
          user: order.user,
          order,
          status,
          note,
        });
        sendTransactionalEmail({
          to: userEmail,
          subject: tpl.subject,
          html: tpl.html,
          type: "order_status",
          userId: order.user._id,
          refId: order._id,
          refType: "order",
        }).catch(() => {});
      }
    } catch (notificationError) {
      console.log("Notification failed:", notificationError.message);
    }

    res.status(200).json({
      success: true,
      order,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Admin: update order (bulk field edit)
// ─────────────────────────────────────────────
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("user", "firstName lastName email phone customerId")
      .populate("items.product", "name slug images sku variants");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Imported for backward compat with existing route code that referenced it.
export { findVariantForItem };
