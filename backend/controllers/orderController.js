import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import sendEmail from "../utils/sendEmail.js";

// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      couponCode,
      paymentMethod,
      paymentStatus,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      codAdvance,
    } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Validate stock
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

      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -quantity },
      });
    }

    if (orderItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid items in cart" });
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;

    // ============ COUPON HANDLING ============
    let discount = 0;
    let couponData = null;

    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        });

        if (coupon) {
          if (
            coupon.totalUsageLimit &&
            coupon.usedCount >= coupon.totalUsageLimit
          ) {
            console.log("Coupon usage limit reached");
          } else {
            let discountBase = subtotal;
            if (coupon.discountOn === "delivery") discountBase = shippingCost;

            if (coupon.discountType === "percentage") {
              discount = (discountBase * coupon.discountValue) / 100;
              if (coupon.maxDiscount)
                discount = Math.min(discount, coupon.maxDiscount);
            } else {
              discount = Math.min(coupon.discountValue, discountBase);
            }

            discount = Math.round(discount * 100) / 100;
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            await coupon.save();

            couponData = {
              code: coupon.code,
              discount: discount,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountOn: coupon.discountOn,
            };
          }
        }
      } catch (e) {
        console.log("Coupon processing error:", e.message);
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCost);

    // ============ COD ADVANCE (10%) ============
    let codAdvanceAmount = 0;
    let amountToPay = total;
    let remainingCOD = total;

    if (paymentMethod === "cod" && codAdvance) {
      codAdvanceAmount = Math.round(total * 0.1 * 100) / 100; // 10% advance
      remainingCOD = Math.round((total - codAdvanceAmount) * 100) / 100;
      amountToPay = codAdvanceAmount; // Amount to pay online now
    }

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
      discount: Number(discount),
      coupon: couponData,
      total: Number(total),
      codAdvance: Number(codAdvanceAmount),
      amountToPay: Number(amountToPay),
      remainingCOD: Number(remainingCOD),
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentStatus || "pending",
      isCOD: paymentMethod !== "online",
      codAmount: paymentMethod !== "online" ? Number(remainingCOD) : 0,
      orderStatus: paymentStatus === "paid" ? "confirmed" : "pending",
      paymentDetails: razorpay_payment_id
        ? {
            transactionId: razorpay_payment_id,
            paymentGateway: "razorpay",
            razorpayOrderId: razorpay_order_id,
          }
        : null,
      statusHistory: [
        {
          status: paymentStatus === "paid" ? "confirmed" : "pending",
          note:
            paymentStatus === "paid"
              ? "Payment received via Razorpay"
              : codAdvance
                ? "10% advance paid"
                : "Order placed",
          date: new Date(),
        },
      ],
    };

    const order = await Order.create(orderData);

    // ============ SAVE SHIPPING ADDRESS AS USER ADDRESS ============
    // If user has no addresses, save the shipping address as default
    if (
      shippingAddress &&
      shippingAddress.fullName &&
      shippingAddress.addressLine1
    ) {
      try {
        const user = await User.findById(req.user._id);

        // Check if user has any addresses
        if (!user.addresses || user.addresses.length === 0) {
          // Save the shipping address as a new address with "Home" label
          user.addresses.push({
            name: "Home",
            fullName: shippingAddress.fullName || "",
            phone: shippingAddress.phone || "",
            addressLine1: shippingAddress.addressLine1 || "",
            addressLine2: shippingAddress.addressLine2 || "",
            landmark: shippingAddress.landmark || "",
            area: shippingAddress.area || "",
            city: shippingAddress.city || "",
            state: shippingAddress.state || "",
            pincode: shippingAddress.pincode || "",
            isDefault: true,
          });
          await user.save();
          console.log(
            "✅ Shipping address saved as default for user:",
            req.user._id,
          );
        } else {
          // Check if this exact address already exists
          const addressExists = user.addresses.some(
            (addr) =>
              addr.addressLine1 === shippingAddress.addressLine1 &&
              addr.city === shippingAddress.city &&
              addr.pincode === shippingAddress.pincode,
          );

          // If address doesn't exist, add it as a non-default address
          if (!addressExists) {
            user.addresses.push({
              name: "Home",
              fullName: shippingAddress.fullName || "",
              phone: shippingAddress.phone || "",
              addressLine1: shippingAddress.addressLine1 || "",
              addressLine2: shippingAddress.addressLine2 || "",
              landmark: shippingAddress.landmark || "",
              area: shippingAddress.area || "",
              city: shippingAddress.city || "",
              state: shippingAddress.state || "",
              pincode: shippingAddress.pincode || "",
              isDefault: false,
            });
            await user.save();
            console.log(
              "✅ Shipping address saved as additional address for user:",
              req.user._id,
            );
          }
        }
      } catch (addressError) {
        console.log(
          "⚠️ Failed to save shipping address to user profile:",
          addressError.message,
        );
        // Don't fail the order if address saving fails
      }
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Send confirmation email
    try {
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0B1C39;">Order Confirmed!</h1>
          <p>Thank you for your order, <strong>${shippingAddress?.fullName || "Customer"}</strong>!</p>
          <div style="background: #EBF4FC; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="font-size: 18px;">Order Number: <strong style="color: #3D96EB;">${order.orderNumber}</strong></p>
            <p style="font-size: 24px; font-weight: bold; color: #0B1C39;">Total: ₹${total.toLocaleString()}</p>
            ${codAdvanceAmount > 0 ? `<p style="color: #F59E0B;">Advance Paid: ₹${codAdvanceAmount.toLocaleString()}</p><p style="color: #F59E0B;">Remaining COD: ₹${remainingCOD.toLocaleString()}</p>` : ""}
            ${couponData ? `<p style="color: #10B981;">Coupon ${couponData.code} - Saved ₹${discount.toLocaleString()}</p>` : ""}
            <p>Payment Method: <strong>${paymentMethod === "online" ? "Online" : codAdvance ? "10% Advance + COD" : "Cash on Delivery"}</strong></p>
          </div>
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/account/orders/${order._id}" 
             style="display:inline-block;padding:12px 24px;background:#3D96EA;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
            Track Your Order
          </a>
        </div>
      `;

      await sendEmail({
        email: req.user.email,
        subject: `Order Confirmed - ${order.orderNumber} | Spexxo`,
        html: emailHTML,
      });
    } catch (emailError) {
      console.log("Email failed:", emailError.message);
    }

    res
      .status(201)
      .json({ success: true, order, message: "Order placed successfully!" });
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
    const order = await Order.findById(req.params.id).populate(
      "items.product",
      "name slug images",
    );
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
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
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

    if (order.orderStatus !== "cancelled") {
      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
      // Restore coupon usage
      if (order.coupon?.code) {
        await Coupon.findOneAndUpdate(
          { code: order.coupon.code },
          { $inc: { usedCount: -1 } },
        );
      }
      // If COD advance was paid, mark refund required
      if (order.codAdvance > 0 && order.paymentStatus === "paid") {
        order.paymentStatus = "refund_pending";
        order.statusHistory.push({
          status: "cancelled",
          note: `Refund of ₹${order.codAdvance} (advance) is pending`,
          date: new Date(),
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

    // ============ SEND NOTIFICATION ============
    try {
      const statusEmails = {
        confirmed: "Order Confirmed",
        processing: "Order Processing",
        shipped: "Order Shipped",
        delivered: "Order Delivered",
        cancelled: "Order Cancelled",
      };

      const userEmail = order.user?.email;
      const userPhone = order.shippingAddress?.phone || order.user?.phone;
      const customerName =
        order.shippingAddress?.fullName || order.user?.firstName || "Customer";

      // Email HTML
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

      // Send Email
      if (userEmail) {
        await sendEmail({
          email: userEmail,
          subject: `Order ${statusEmails[status] || status} - ${order.orderNumber} | Spexxo`,
          html: emailHTML,
        });
        console.log(`✅ Email sent to ${userEmail}`);
      }

      // Send WhatsApp (if phone exists)
      if (userPhone) {
        const whatsappMessage =
          `Hi *${customerName}*,\n\n` +
          `Your order *#${order.orderNumber}* status has been updated to *${(statusEmails[status] || status).toUpperCase()}*.\n\n` +
          `📦 *Order Details:*\n` +
          `• Total: ₹${order.total?.toLocaleString()}\n` +
          `• Payment: ${order.paymentMethod?.toUpperCase()}\n` +
          `${note ? `• Note: ${note}\n` : ""}\n` +
          `Thank you for shopping with Spexxo! 👓`;

        // Send WhatsApp via API (using Twilio or any other service)
        // For now, we'll just log it and the frontend will handle the button click
        // You can integrate with a WhatsApp API like Twilio, WATI, or WhatsApp Business API
        console.log(
          `📱 WhatsApp would be sent to ${userPhone}: ${whatsappMessage}`,
        );

        // Example with a WhatsApp API (you'll need to implement this)
        // await sendWhatsApp(userPhone, whatsappMessage);
      }
    } catch (notificationError) {
      console.log("Notification failed:", notificationError.message);
      // Don't fail the request if notification fails
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
    }).populate("user", "firstName lastName email");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
