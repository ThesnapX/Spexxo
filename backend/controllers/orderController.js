// backend/controllers/orderController.js

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { orderPlacedEmail, orderStatusEmail } from "../utils/emailTemplates.js";
import { sendTransactionalEmail } from "../utils/emailService.js";
import { sendMetaEvent } from "../utils/metaCapi.js";

// ─────────────────────────────────────────────
// Meta Purchase helper (for zero-value / COD-no-advance)
// ─────────────────────────────────────────────
const firePurchaseEvent = async (order, req) => {
  try {
    if (!order) return;
    if (!order.purchaseEventId) {
      order.purchaseEventId = `purchase_${order._id}_${Date.now()}`;
      order.purchaseTrackedAt = new Date();
      await order.save();
    }
    const eventId = order.purchaseEventId;

    const contents = (order.items || []).map((it) => ({
      id: String(it.product?._id || it.product),
      quantity: Number(it.quantity || 1),
      item_price: Number(it.price || 0),
    }));

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
      content_ids: contents.map((c) => c.id),
      content_type: "product",
      contents,
      num_items: contents.reduce((s, c) => s + c.quantity, 0),
      order_id: order.orderNumber || String(order._id),
    };

    console.log(
      `[CAPI] Firing Purchase (instant-confirm) | order=${order.orderNumber} | eventId=${eventId}`,
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
    console.error("[CAPI] Purchase fire error (non-fatal):", err.message);
  }
};

// @desc   Create order (pending, or instantly confirmed for zero/COD-no-advance)
// @route  POST /api/orders
// @access Private
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
    } = req.body;

    let orderItems = items;
    let subtotal = 0;

    if (!orderItems || orderItems.length === 0) {
      const cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
      );
      if (!cart || !cart.items || cart.items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Cart is empty" });
      }
      orderItems = [];
      for (const item of cart.items) {
        const product = item.product;
        const price = product.comparePrice || product.price;
        const quantity = item.quantity;
        const itemTotal = price * quantity;
        subtotal += itemTotal;
        let variantImage = "";
        let variantData = item.variant || null;
        if (variantData?.images?.length) {
          variantImage = variantData.images[0]?.url || "";
        }
        if (!variantImage && variantData?.image) {
          variantImage = variantData.image;
        }
        if (!variantImage) variantImage = product.images?.[0]?.url || "";
        orderItems.push({
          product: product._id,
          name: product.name,
          image: variantImage,
          price,
          quantity,
          subtotal: itemTotal,
          variant: variantData,
        });
      }
    } else {
      for (const item of orderItems) {
        if (!item.product) {
          return res.status(400).json({
            success: false,
            message: "Each item must have a product ID",
          });
        }
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid quantity for product ${item.name || item.product}`,
          });
        }
        if (!item.price || item.price < 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid price for product ${item.name || item.product}`,
          });
        }
        subtotal += (item.price || 0) * (item.quantity || 1);
      }
    }

    let discount = 0;
    let couponData = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });
      if (coupon) {
        if (coupon.discountType === "percentage") {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount)
            discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
        couponData = { code: coupon.code, discount: discount };
      }
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shippingCost);

    // Determine if this order is instantly confirmed (no Razorpay step)
    const isZeroValue = total === 0;
    const isCodNoAdvance = isCOD === true && !codAdvance && total > 0;
    const instantConfirm = isZeroValue || isCodNoAdvance;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems.map((item) => ({
        ...item,
        variant: item.variant || null,
      })),
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod || "online",
      paymentStatus: instantConfirm ? "paid" : "pending",
      orderStatus: instantConfirm ? "confirmed" : "pending",
      subtotal: subtotal,
      shippingCost: shippingCost,
      discount: discount,
      coupon: couponData,
      total: total,
      isCOD: isCOD || false,
      codAdvance: codAdvance || 0,
      remainingCOD: remainingCOD || 0,
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
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name slug images sku variants")
      .populate("user", "firstName lastName email phone customerId");

    // Fire Purchase for instantly-confirmed orders
    if (instantConfirm) {
      await firePurchaseEvent(populatedOrder, req);
    }

    // Send order-placed email (non-blocking)
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

    // Reset follow-up stages
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

    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: instantConfirm
        ? "Order confirmed"
        : "Order created, awaiting payment",
    });
  } catch (error) {
    console.error("[ORDER] Create order error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

// ─────────────────────────────────────────────
// All other order controllers unchanged
// ─────────────────────────────────────────────
export const cancelPendingOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.orderStatus !== "pending")
      return res
        .status(400)
        .json({
          success: false,
          message: "Only pending orders can be cancelled",
        });
    if (order.user.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

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

    if (order.orderStatus === "confirmed") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) continue;
        if (item.variant && product.variants?.length > 0) {
          const variantIndex = product.variants.findIndex(
            (v) =>
              v._id?.toString() === item.variant._id?.toString() ||
              v.name === item.variant.name ||
              v.sku === item.variant.sku,
          );
          if (variantIndex !== -1) {
            product.variants[variantIndex].stock += quantity;
          }
        } else {
          product.stock += quantity;
        }
        if (product.productType === "variable") {
          let totalStock = 0;
          product.variants.forEach((v) => {
            totalStock += v.stock || 0;
          });
          product.stock = totalStock;
        }
        await product.save();
      }
    }

    if (order.coupon?.code) {
      await Coupon.findOneAndUpdate(
        { code: order.coupon.code },
        { $inc: { usedCount: -1 } },
      );
    }

    let refundAmount = 0;
    let refundNote = "";
    if (order.codAdvance > 0 && order.paymentStatus === "paid") {
      refundAmount = order.codAdvance;
      refundNote = `Order cancelled. Refund of ₹${refundAmount} (advance) is pending.`;
      order.paymentStatus = "refund_pending";
    } else if (
      order.paymentStatus === "paid" &&
      order.paymentMethod === "online"
    ) {
      refundAmount = order.total || 0;
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

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "firstName lastName email phone customerId")
        .populate("items.product", "name slug images sku variants")
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);
    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

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
