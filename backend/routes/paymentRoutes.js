// backend/routes/paymentRoutes.js

import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
  verifyCODAdvance,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import { paymentLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// Public — only exposes the public key, no secrets.
router.get("/key", getRazorpayKey);

// Protected + rate-limited.
router.post("/create-order", protect, paymentLimiter, createRazorpayOrder);
router.post("/verify", protect, paymentLimiter, verifyRazorpayPayment);
router.post("/verify-cod-advance", protect, paymentLimiter, verifyCODAdvance);

export default router;
