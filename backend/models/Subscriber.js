// backend/models/Subscriber.js

import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for guests who haven't signed up
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: "footer", // "footer" | "popup" | "checkout" | ...
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);
export default Subscriber;
