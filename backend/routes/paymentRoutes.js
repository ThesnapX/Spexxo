import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
  verifyCODAdvance,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/key", getRazorpayKey);
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/verify-cod-advance", protect, verifyCODAdvance);

export default router;
