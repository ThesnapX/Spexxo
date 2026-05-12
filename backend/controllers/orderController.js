import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import sendEmail from "../utils/sendEmail.js";

// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate stock for ALL items first
    for (const item of cart.items) {
      const product = item.product;
      if (!product) continue;

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sorry, only ${product.stock} units of "${product.name}" are available. Please reduce quantity.`,
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product) continue;

      const price = Number(item.price || product.price || 0);
      const quantity = Number(item.quantity || 1);
      const itemSubtotal = price * quantity;

      orderItems.push({
        product: product._id,
        name: product.name || "Product",
        image: product.images?.[0]?.url || "",
        price: price,
        quantity: quantity,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;

      // Reduce stock - ONE TIME only
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -quantity },
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items in cart",
      });
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shippingCost;

    const orderData = {
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress?.fullName || "",
        phone: shippingAddress?.phone || "",
        addressLine1: shippingAddress?.addressLine1 || "",
        addressLine2: shippingAddress?.addressLine2 || "",
        landmark: shippingAddress?.landmark || "",
        area: shippingAddress?.area || "",
        city: shippingAddress?.city || "",
        state: shippingAddress?.state || "",
        pincode: shippingAddress?.pincode || "",
      },
      subtotal: Number(subtotal),
      shippingCost: Number(shippingCost),
      tax: 0,
      discount: 0,
      total: Number(total),
      paymentMethod: "cod",
      paymentStatus: "pending",
      isCOD: true,
      codAmount: Number(total),
      orderStatus: "pending",
      statusHistory: [
        { status: "pending", note: "Order placed", date: new Date() },
      ],
    };

    const order = await Order.create(orderData);

    // Clear cart AFTER successful order
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      order,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
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
      .populate("items.product", "name slug images");

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.product",
      "name slug images",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel order
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

    // ONLY restore stock if order wasn't already cancelled
    if (order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.orderStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: "Cancelled by customer",
      date: new Date(),
    });
    await order.save();

    res.status(200).json({
      success: true,
      order,
      message: "Order cancelled. Stock restored.",
    });
  } catch (error) {
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
        .populate("user", "firstName lastName email")
        .populate("items.product", "name slug images")
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
    res.status(400).json({
      success: false,
      message: error.message,
    });
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
      "email firstName",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
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

    // Send status update email
    try {
      const statusEmails = {
        confirmed: "Order Confirmed ✅",
        processing: "Order Processing 🔄",
        shipped: "Order Shipped 📦",
        delivered: "Order Delivered 🎉",
        cancelled: "Order Cancelled ❌",
      };

      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>${statusEmails[status] || "Order Update"}</h1>
          <p>Your order <strong>#${order.orderNumber}</strong> has been updated to: <strong style="color: #3D96EB;">${status}</strong></p>
          ${note ? `<p style="background: #f9f9f9; padding: 10px; border-radius: 8px;">📝 ${note}</p>` : ""}
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/account/orders/${order._id}" 
             style="display:inline-block;padding:12px 24px;background:#3D96EA;color:white;text-decoration:none;border-radius:8px;">
            View Order Details
          </a>
        </div>
      `;

      await sendEmail({
        email: order.user.email,
        subject: `Order ${status} - ${order.orderNumber} | Spexxo`,
        html: emailHTML,
      });
    } catch (emailError) {
      console.log("Status email failed to send:", emailError.message);
    }

    res.status(200).json({
      success: true,
      order,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
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
    }).populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
