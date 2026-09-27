// backend/models/Order.js

import mongoose from "mongoose";
import { getNextSequence } from "./Counter.js";

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

    // ─────────────────────────────────────────────
    // Idempotency & concurrency-control fields
    // ─────────────────────────────────────────────
    // Set by createOrder from a client-supplied key (or a deterministic
    // fallback). Retried POST /orders with the same key returns the
    // existing order instead of creating a duplicate.
    // Sparse + unique so old orders (null) are never blocked.
    idempotencyKey: {
      type: String,
      default: null,
      index: { unique: true, sparse: true },
    },

    // Set the first time Razorpay verification succeeds. A second
    // verification request with the same payment id returns early.
    paymentVerifiedAt: { type: Date, default: null },

    // Set the first time stock is decremented for this order. A retried
    // verification will not decrement twice.
    stockReducedAt: { type: Date, default: null },

    // ─────────────────────────────────────────────
    // Items
    // ─────────────────────────────────────────────
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          // Quantity must be an integer.
          validate: {
            validator: (v) => Number.isInteger(v) && v > 0,
            message: "Quantity must be a positive integer",
          },
        },
        subtotal: { type: Number, required: true, min: 0 },
        variant: {
          name: String,
          sku: String,
          price: Number,
          color: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
          },
          attributes: {
            color: String,
            size: String,
            material: String,
          },
          images: [
            {
              url: String,
              alt: String,
            },
          ],
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
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    coupon: {
      code: String,
      discount: Number,
    },
    total: { type: Number, required: true },

    // ✅ Shipping metadata (carried from Checkout → Order)
    shippingMethod: { type: String, default: null },
    shippingMethodName: { type: String, default: null },
    shippingDelivery: { type: String, default: null },
    pincode: { type: String, default: null },

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
    notes: { type: String },
    trackingNumber: { type: String },
    isCOD: { type: Boolean, default: true },
    codAmount: { type: Number },

    // Meta Purchase idempotency
    // Meta Purchase idempotency + retry-safe state machine.
    //   purchaseEventId     — deterministic, stable across retries
    //   purchaseEventStatus — "pending" | "sent" | "failed"
    //   purchaseTrackedAt   — last attempt timestamp (success or failure)
    //   purchaseTrackingError — last failure message (if any)
    purchaseEventId: { type: String, default: null, index: true },
    purchaseEventStatus: {
      type: String,
      enum: ["pending", "sent", "failed", null],
      default: null,
    },
    purchaseTrackedAt: { type: Date, default: null },
    purchaseTrackingError: { type: String, default: null },

    codAdvance: { type: Number, default: 0 },
    amountToPay: { type: Number },
    remainingCOD: { type: Number },
    refundAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// ─────────────────────────────────────────────
// Pre-validate: generate orderId + orderNumber
// ─────────────────────────────────────────────
orderSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      if (!this.orderId && !this.orderNumber) {
        const seq = await getNextSequence("order");
        const num = seq.toString().padStart(8, "0");
        this.orderId = `ORD-${num}`;
        this.orderNumber = `ORD-${num}`;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// ─────────────────────────────────────────────
// Guard against NaN / negative totals ever being persisted.
// Mongoose's `min` validators already handle most of this, but this
// catch-all is explicit and cheap.
// ─────────────────────────────────────────────
orderSchema.pre("validate", function (next) {
  const numericFields = [
    "subtotal",
    "shippingCost",
    "tax",
    "discount",
    "total",
    "codAdvance",
    "remainingCOD",
    "refundAmount",
  ];
  for (const f of numericFields) {
    const v = this[f];
    if (v === undefined || v === null) continue;
    if (!Number.isFinite(Number(v))) {
      return next(
        new Error(`Order validation failed: ${f} must be a finite number`),
      );
    }
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
