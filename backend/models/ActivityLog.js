// backend/models/ActivityLog.js
//
// Lightweight activity log used for product/wishlist analytics.
//
// Purpose:
//   - count AddToCart actions (not cart quantity)
//   - count Wishlist-add actions
//   - identify most-added products
//
// Retention: TTL 180 days to keep the collection bounded.
// Non-blocking writes — used in controllers via fire-and-forget.

import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["cart_add", "wishlist_add", "visit"],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // guests have null
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { timestamps: true },
);

// Fast aggregations
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, product: 1 });
activityLogSchema.index({ type: 1, user: 1 });

// TTL — drop after 180 days
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 },
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
