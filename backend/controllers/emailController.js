// backend/controllers/emailController.js

import User from "../models/User.js";
import Subscriber from "../models/Subscriber.js";
import EmailTemplate from "../models/EmailTemplate.js";
import EmailCampaign from "../models/EmailCampaign.js";
import sendEmail from "../utils/sendEmail.js";

// ─────────────────────────────────────────────
// Build recipient list based on audience
// ─────────────────────────────────────────────
const resolveAudience = async (audienceType, customRecipients = []) => {
  const set = new Set();

  if (audienceType === "all_users") {
    const users = await User.find({ email: { $exists: true, $ne: null } })
      .select("email")
      .lean();
    users.forEach((u) => u.email && set.add(u.email.toLowerCase()));
  }

  if (audienceType === "subscribers_only") {
    const subs = await Subscriber.find({
      isActive: true,
      email: { $exists: true, $ne: null },
    })
      .select("email")
      .lean();
    subs.forEach((s) => s.email && set.add(s.email.toLowerCase()));
  }

  if (audienceType === "subscribers_plus_users") {
    const [users, subs] = await Promise.all([
      User.find({ email: { $exists: true, $ne: null } })
        .select("email")
        .lean(),
      Subscriber.find({ isActive: true, email: { $exists: true, $ne: null } })
        .select("email")
        .lean(),
    ]);
    users.forEach((u) => u.email && set.add(u.email.toLowerCase()));
    subs.forEach((s) => s.email && set.add(s.email.toLowerCase()));
  }

  if (audienceType === "custom") {
    customRecipients.forEach((email) => {
      if (email && /^\S+@\S+\.\S+$/.test(email)) {
        set.add(email.toLowerCase().trim());
      }
    });
  }

  return Array.from(set);
};

// ─────────────────────────────────────────────
// Count recipients (for preview)
// ─────────────────────────────────────────────
export const getAudienceCount = async (req, res) => {
  try {
    const { audienceType = "subscribers_only" } = req.query;

    let count = 0;
    if (audienceType === "all_users") {
      count = await User.countDocuments({
        email: { $exists: true, $ne: null },
      });
    } else if (audienceType === "subscribers_only") {
      count = await Subscriber.countDocuments({
        isActive: true,
        email: { $exists: true, $ne: null },
      });
    } else if (audienceType === "subscribers_plus_users") {
      const [u, s] = await Promise.all([
        User.countDocuments({ email: { $exists: true, $ne: null } }),
        Subscriber.countDocuments({
          isActive: true,
          email: { $exists: true, $ne: null },
        }),
      ]);
      // Approximate — deduplication happens at send time
      count = u + s;
    }

    res.json({ success: true, count, audienceType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Preview audience (returns first N emails)
// ─────────────────────────────────────────────
export const previewAudience = async (req, res) => {
  try {
    const { audienceType = "subscribers_only", customRecipients = [] } =
      req.body;
    const list = await resolveAudience(audienceType, customRecipients);
    res.json({
      success: true,
      count: list.length,
      sample: list.slice(0, 20),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Send bulk email campaign
// ─────────────────────────────────────────────
export const sendBulkEmail = async (req, res) => {
  try {
    const {
      name,
      subject,
      content,
      audienceType = "subscribers_only",
      customRecipients = [],
    } = req.body;

    if (!subject || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Subject and content are required" });
    }

    const emailList = await resolveAudience(audienceType, customRecipients);

    if (emailList.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No recipients found" });
    }

    // Create campaign record
    const campaign = await EmailCampaign.create({
      name: name || `Campaign ${new Date().toLocaleString()}`,
      subject,
      content,
      audienceType,
      customRecipients,
      recipients: emailList,
      recipientCount: emailList.length,
      status: "sending",
      createdBy: req.user?._id,
    });

    // Send emails (non-blocking batch — respond immediately)
    res.status(200).json({
      success: true,
      message: `Campaign started for ${emailList.length} recipients.`,
      campaignId: campaign._id,
      recipientCount: emailList.length,
    });

    // Process in background
    (async () => {
      let sentCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const email of emailList) {
        try {
          await sendEmail({ email, subject, html: content });
          sentCount++;
        } catch (error) {
          failedCount++;
          errors.push({ email, message: error.message });
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      campaign.sentCount = sentCount;
      campaign.failedCount = failedCount;
      campaign.errors = errors;
      campaign.status = failedCount === emailList.length ? "failed" : "sent";
      campaign.sentAt = new Date();
      await campaign.save();

      console.log(
        `[EMAIL] Campaign ${campaign._id} complete: ${sentCount} sent, ${failedCount} failed`,
      );
    })();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Templates CRUD
// ─────────────────────────────────────────────
export const getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort("-createdAt");
    res.status(200).json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.create(req.body);
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template)
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    res.status(200).json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────
export const getEmailCampaigns = async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .select("-recipients -errors -content")
      .sort("-createdAt");
    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmailCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEmailCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
    if (!campaign)
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    res.status(200).json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
