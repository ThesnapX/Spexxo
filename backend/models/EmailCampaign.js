import mongoose from "mongoose";

const emailCampaignSchema = new mongoose.Schema({
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
  recipients: [
    {
      type: String,
    },
  ],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: {
    type: Date,
  },
});

const EmailCampaign = mongoose.model("EmailCampaign", emailCampaignSchema);
export default EmailCampaign;
