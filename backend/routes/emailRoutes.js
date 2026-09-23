// backend/routes/emailRoutes.js

import express from "express";
import {
  sendBulkEmail,
  getAudienceCount,
  previewAudience,
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailCampaigns,
  getEmailCampaign,
  deleteEmailCampaign,
} from "../controllers/emailController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, admin);

// Audience
router.get("/audience/count", getAudienceCount);
router.post("/audience/preview", previewAudience);

// Send
router.post("/send-bulk", sendBulkEmail);

// Templates
router.get("/templates", getEmailTemplates);
router.get("/templates/:id", getEmailTemplate);
router.post("/templates", createEmailTemplate);
router.put("/templates/:id", updateEmailTemplate);
router.delete("/templates/:id", deleteEmailTemplate);

// Campaigns
router.get("/campaigns", getEmailCampaigns);
router.get("/campaigns/:id", getEmailCampaign);
router.delete("/campaigns/:id", deleteEmailCampaign);

export default router;
