// backend/models/EmailCampaign.js

import mongoose from "mongoose";

const emailCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // "all_users" | "subscribers_only" | "subscribers_plus_users" | "custom"
    audienceType: {
      type: String,
      enum: [
        "all_users",
        "subscribers_only",
        "subscribers_plus_users",
        "custom",
      ],
      default: "subscribers_only",
    },
    customRecipients: [String],
    recipients: [String], // resolved list actually sent to
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sending", "sent", "failed"],
      default: "draft",
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        email: String,
        message: String,
      },
    ],
    sentAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

const EmailCampaign = mongoose.model("EmailCampaign", emailCampaignSchema);
export default EmailCampaign;
