import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    discountOn: {
      type: String,
      enum: ["product", "delivery", "total"],
      default: "total",
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Total usage limit across all users
    totalUsageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    // How many times ONE user can use this coupon
    perUserLimit: {
      type: Number,
      default: 1,
    },
    // Track total usage count
    usedCount: {
      type: Number,
      default: 0,
    },
    // Track which users used this and how many times
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 1,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
