// backend/routes/analyticsRoutes.js

import express from "express";
import {
  trackVisit,
  getDashboardAnalytics,
} from "../controllers/analyticsController.js";
import { protect, admin, optionalAuth } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Visit endpoint is public but rate-limited to prevent spam.
const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 500,
  message: { success: false, message: "Too many visit events" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    process.env.NODE_ENV !== "production" &&
    (req.ip === "::1" || req.ip === "127.0.0.1"),
});

router.post("/visit", visitLimiter, optionalAuth, trackVisit);
router.get("/dashboard", protect, admin, getDashboardAnalytics);

export default router;
