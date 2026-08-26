// backend/models/Order.js

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          default: "",
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
        variant: {
          name: String,
          sku: String,
          price: Number,
          color: {
            _id: mongoose.Schema.Types.ObjectId,
            name: String,
            hexCode: String,
          },
          attributes: {
            color: String,
            size: String,
            material: String,
          },
        },
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      area: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refund_pending", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      transactionId: String,
      paymentGateway: String,
      razorpayOrderId: String,
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    coupon: {
      code: String,
      discount: Number,
    },
    total: {
      type: Number,
      required: true,
    },
    statusHistory: [
      {
        status: String,
        date: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    notes: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    isCOD: {
      type: Boolean,
      default: true,
    },
    codAmount: {
      type: Number,
    },
    codAdvance: { type: Number, default: 0 },
    amountToPay: { type: Number },
    remainingCOD: { type: Number },
    refundAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Generate orderId and orderNumber BEFORE validation
orderSchema.pre("validate", async function (next) {
  if (this.isNew) {
    // Generate orderId
    if (!this.orderId) {
      const count = await mongoose.model("Order").countDocuments();
      const nextNumber = (count + 1).toString().padStart(10, "0");
      this.orderId = `ORD-${nextNumber}`;
    }

    // Generate orderNumber with 8 digits after ORD
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString();
      const count = await mongoose.model("Order").countDocuments();
      const nextNumber = (count + 1).toString().padStart(8, "0");
      this.orderNumber = `ORD-${nextNumber}`;
    }
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
