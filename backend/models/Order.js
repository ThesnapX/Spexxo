import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          name: String,
          sku: String,
        },
        name: String,
        image: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subtotal: Number,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
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
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentDetails: {
      transactionId: String,
      paymentGateway: String,
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
  },
  {
    timestamps: true,
  },
);

// Generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const prefix = "SPX";
    const dateStr =
      date.getFullYear().toString().substr(-2) +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.orderNumber = `${prefix}${dateStr}${random}`;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
