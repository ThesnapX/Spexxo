// backend/models/Coupon.js

import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    couponId: {
      type: String,
      unique: true,
      sparse: true,
    },
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
    totalUsageLimit: {
      type: Number,
      default: null,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
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

// Generate couponId before saving
couponSchema.pre("save", async function (next) {
  if (this.isNew && !this.couponId) {
    const count = await mongoose.model("Coupon").countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, "0");
    this.couponId = `CPN-${nextNumber}`;
  }
  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
