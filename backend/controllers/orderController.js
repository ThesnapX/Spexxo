// backend/controllers/orderController.js

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import sendEmail from "../utils/sendEmail.js";

// @desc    Create order (Initial - Payment Pending)
// @route   POST /api/orders
// @access  Private
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

    console.log("[ORDER] Creating order for user:", req.user._id);
    console.log("[ORDER] Payment method:", paymentMethod);
    console.log("[ORDER] Items count:", items?.length || 0);

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

      // backend/controllers/orderController.js - createOrder (items creation)

      orderItems = [];
      for (const item of cart.items) {
        const product = item.product;
        const price = product.comparePrice || product.price;
        const quantity = item.quantity;
        const itemTotal = price * quantity;
        subtotal += itemTotal;

        // ✅ Get variant image if available
        let variantImage = "";
        let variantData = item.variant || null;

        if (
          variantData &&
          variantData.images &&
          variantData.images.length > 0
        ) {
          variantImage = variantData.images[0]?.url || "";
        }
        if (!variantImage && variantData && variantData.image) {
          variantImage = variantData.image;
        }
        if (!variantImage) {
          variantImage = product.images?.[0]?.url || "";
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          image: variantImage,
          price: price,
          quantity: quantity,
          subtotal: itemTotal,
          variant: variantData,
        });
      }
    } else {
      // ✅ Validate each item has required fields
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
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
        couponData = {
          code: coupon.code,
          discount: discount,
        };
      }
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shippingCost);

    // ✅ Create order with PENDING status - STOCK NOT REDUCED YET
    const order = await Order.create({
      user: req.user._id,
      items: orderItems.map((item) => ({
        ...item,
        variant: item.variant || null,
      })),
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod || "online",
      paymentStatus: "pending",
      orderStatus: "pending",
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
          status: "pending",
          note: "Order created, awaiting payment",
          date: new Date(),
        },
      ],
    });

    console.log(
      "[ORDER] Order created with pending status:",
      order.orderNumber,
    );

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name slug images sku variants")
      .populate("user", "firstName lastName email phone customerId");

    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: "Order created, awaiting payment",
    });
  } catch (error) {
    console.error("[ORDER] Create order error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

// @desc    Cancel pending order (if payment fails or user cancels)
// @route   DELETE /api/orders/:id/cancel-pending
// @access  Private
export const cancelPendingOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only allow cancellation of pending orders
    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Delete the order - no stock to restore since stock wasn't reduced
    await Order.findByIdAndDelete(req.params.id);

    console.log("[ORDER] Pending order deleted:", order.orderNumber);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("[ORDER] Cancel pending order error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name slug images sku variants")
      .populate(
        "user",
        "firstName lastName email phone customerId username role createdAt",
      );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

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

// @desc    Cancel order (user or admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

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
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // ✅ Restore stock for all items (only if order was confirmed)
    if (order.orderStatus === "confirmed") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          // ✅ Validate quantity before restoring
          const quantity = Number(item.quantity);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            console.error(
              `[ORDER] Invalid quantity for stock restoration: ${item.quantity}`,
            );
            continue;
          }

          if (item.variant && product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(
              (v) =>
                v._id?.toString() === item.variant._id?.toString() ||
                v.name === item.variant.name ||
                v.sku === item.variant.sku,
            );

            if (variantIndex !== -1) {
              product.variants[variantIndex].stock += quantity;
              console.log(
                `[ORDER] Restored stock for variant ${product.variants[variantIndex].name}`,
              );
            }
          } else {
            product.stock += quantity;
            console.log(`[ORDER] Restored stock for ${product.name}`);
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

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
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

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id).populate(
      "user",
      "email firstName phone",
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

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

    // Send notification
    try {
      const statusEmails = {
        confirmed: "Order Confirmed",
        processing: "Order Processing",
        shipped: "Order Shipped",
        delivered: "Order Delivered",
        cancelled: "Order Cancelled",
      };

      const userEmail = order.user?.email;
      const customerName =
        order.shippingAddress?.fullName || order.user?.firstName || "Customer";

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0B1C39; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0;">Spe<span style="color: #3D96EB;">xx</span>o</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #0B1C39; margin-top: 0;">Order Status Update</h2>
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Your order <strong style="color: #3D96EB;">#${order.orderNumber}</strong> has been updated to:</p>
            <div style="background: #EBF4FC; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 24px; font-weight: bold; color: #3D96EB; margin: 0;">
                ${statusEmails[status] || status.toUpperCase()}
              </p>
            </div>
            ${note ? `<p style="background: #f9f9f9; padding: 10px; border-radius: 8px; border-left: 4px solid #3D96EB;">📝 ${note}</p>` : ""}
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order Total:</strong> ₹${order.total?.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase()}</p>
            </div>
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/account/orders/${order._id}" 
               style="display:inline-block;padding:12px 24px;background:#3D96EA;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
              View Order Details
            </a>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Thank you for shopping with Spexxo! 👓</p>
          </div>
        </div>
      `;

      if (userEmail) {
        await sendEmail({
          email: userEmail,
          subject: `Order ${statusEmails[status] || status} - ${order.orderNumber} | Spexxo`,
          html: emailHTML,
        });
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

// @desc    Update order (Admin)
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("user", "firstName lastName email phone customerId")
      .populate("items.product", "name slug images sku variants");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
