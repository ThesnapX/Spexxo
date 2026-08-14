import User from "../models/User.js";
import EmailTemplate from "../models/EmailTemplate.js";
import EmailCampaign from "../models/EmailCampaign.js";
import sendEmail from "../utils/sendEmail.js";

// @desc    Send bulk marketing email
// @route   POST /api/email/send-bulk
// @access  Private/Admin
export const sendBulkEmail = async (req, res) => {
  try {
    const { subject, content, recipients, recipientType } = req.body;

    let emailList = [];

    if (recipientType === "all") {
      // Send to all users
      const users = await User.find({
        email: { $exists: true, $ne: null },
      }).select("email firstName");
      emailList = users.map((u) => u.email).filter((e) => e);
    } else if (
      recipientType === "custom" &&
      recipients &&
      recipients.length > 0
    ) {
      // Send to custom list
      emailList = recipients;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "No recipients specified" });
    }

    if (emailList.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No recipients found" });
    }

    // Create campaign record
    const campaign = await EmailCampaign.create({
      name: req.body.name || `Campaign ${new Date().toLocaleString()}`,
      subject,
      content,
      recipients: emailList,
      status: "sending",
    });

    // Send emails
    let sentCount = 0;
    let failedCount = 0;

    for (const email of emailList) {
      try {
        await sendEmail({
          email,
          subject,
          html: content,
        });
        sentCount++;
      } catch (error) {
        console.log(`Failed to send to ${email}:`, error.message);
        failedCount++;
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Update campaign
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.status = "sent";
    campaign.sentAt = new Date();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Email sent to ${sentCount} recipients. ${failedCount} failed.`,
      sentCount,
      failedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get email templates
// @route   GET /api/email/templates
// @access  Private/Admin
export const getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort("-createdAt");
    res.status(200).json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create email template
// @route   POST /api/email/templates
// @access  Private/Admin
export const createEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.create(req.body);
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete email template
// @route   DELETE /api/email/templates/:id
// @access  Private/Admin
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

// @desc    Get email campaigns
// @route   GET /api/email/campaigns
// @access  Private/Admin
export const getEmailCampaigns = async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find().sort("-createdAt");
    res.status(200).json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
