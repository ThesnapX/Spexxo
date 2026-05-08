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

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      const price = item.variant ? item.variant.price : product.price;
      const itemSubtotal = price * item.quantity;

      orderItems.push({
        product: product._id,
        variant: item.variant,
        name: product.name,
        image: product.images[0]?.url || "",
        price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;

      // Update stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    let discount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
      // Validate coupon logic here
      coupon = { code: couponCode, discount: 0 };
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const tax = 0;
    const total = subtotal - discount + shippingCost + tax;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      discount,
      coupon,
      total,
      paymentMethod: "cod",
      isCOD: true,
      codAmount: total,
      statusHistory: [
        {
          status: "pending",
          note: "Order placed",
        },
      ],
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    // Send order confirmation email
    const emailHTML = `
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order. Your order number is: <strong>${order.orderNumber}</strong></p>
      <p>Total Amount: ₹${total}</p>
      <p>Payment Method: Cash on Delivery</p>
      <p>Your order will be delivered to:</p>
      <p>${shippingAddress.fullName}<br>
      ${shippingAddress.street}<br>
      ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}<br>
      Phone: ${shippingAddress.phone}</p>
      <p>We'll notify you when your order ships.</p>
      <a href="${process.env.FRONTEND_URL}/account/orders/${order._id}" style="display:inline-block;padding:12px 24px;background:#3D96EA;color:white;text-decoration:none;border-radius:4px;">Track Order</a>
    `;

    try {
      await sendEmail({
        email: req.user.email,
        subject: `Order Confirmed - ${order.orderNumber}`,
        html: emailHTML,
      });
    } catch (emailError) {
      console.log("Order confirmation email failed");
    }

    res.status(201).json({
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

    // Check ownership
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
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    order.orderStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: "Cancelled by customer",
    });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
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

    order.orderStatus = status;
    order.statusHistory.push({ status, note: note || `Order ${status}` });

    // Update payment status for COD
    if (status === "delivered" && order.isCOD) {
      order.paymentStatus = "paid";
    }

    await order.save();

    // Send status update email
    const statusEmails = {
      confirmed: "Order Confirmed",
      processing: "Order Processing",
      shipped: "Order Shipped",
      delivered: "Order Delivered",
      cancelled: "Order Cancelled",
    };

    const emailHTML = `
      <h1>${statusEmails[status] || "Order Update"}</h1>
      <p>Your order <strong>#${order.orderNumber}</strong> has been ${status}.</p>
      ${note ? `<p>Note: ${note}</p>` : ""}
      <p>Track your order at: <a href="${process.env.FRONTEND_URL}/account/orders/${order._id}">View Order</a></p>
    `;

    try {
      await sendEmail({
        email: order.user.email,
        subject: `Order ${status} - ${order.orderNumber}`,
        html: emailHTML,
      });
    } catch (emailError) {
      console.log("Status email failed to send");
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
