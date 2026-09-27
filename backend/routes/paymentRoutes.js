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

router.get("/key", getRazorpayKey);
router.post("/create-order", protect, paymentLimiter, createRazorpayOrder);
router.post("/verify", protect, paymentLimiter, verifyRazorpayPayment);
router.post("/verify-cod-advance", protect, paymentLimiter, verifyCODAdvance);

export default router;
