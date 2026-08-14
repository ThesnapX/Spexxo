import express from "express";
import {
  sendBulkEmail,
  getEmailTemplates,
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailCampaigns,
} from "../controllers/emailController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.post("/send-bulk", protect, admin, sendBulkEmail);
router.get("/templates", protect, admin, getEmailTemplates);
router.post("/templates", protect, admin, createEmailTemplate);
router.delete("/templates/:id", protect, admin, deleteEmailTemplate);
router.get("/campaigns", protect, admin, getEmailCampaigns);

export default router;
