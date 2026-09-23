// backend/models/EmailLog.js

import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      // "order_placed" | "order_status" | "welcome" | "wishlist_added" |
      // "cart_added" | "abandoned_cart_1" | "abandoned_cart_2" |
      // "abandoned_cart_3" | "abandoned_cart_4" |
      // "abandoned_wishlist_1" ... "abandoned_wishlist_4"
      index: true,
    },
    subject: String,
    // Reference to the entity that triggered this email
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // "cart" | "wishlist" | "order"
    refType: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    error: String,
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Compound index for fast dedupe lookup
emailLogSchema.index({ email: 1, type: 1, refId: 1 });
// TTL — auto-delete logs older than 90 days to keep collection small
emailLogSchema.index({ sentAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
