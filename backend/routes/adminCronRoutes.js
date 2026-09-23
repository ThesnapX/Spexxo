// backend/routes/adminCronRoutes.js

import express from "express";
import { protect, admin } from "../middleware/auth.js";
import { runAllFollowUps } from "../services/abandonedFollowUpService.js";

const router = express.Router();

// @desc   Manually trigger abandoned cart/wishlist follow-up job
// @route  POST /api/admin/cron/run-follow-ups
router.post("/run-follow-ups", protect, admin, async (req, res) => {
  try {
    await runAllFollowUps();
    res.json({ success: true, message: "Follow-up job completed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
