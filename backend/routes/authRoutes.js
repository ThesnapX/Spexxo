// backend/routes/authRoutes.js

import express from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  checkUsername,
  updateFullProfile,
  updateDeliveryAddress,
  checkEmailExists,
  checkPhoneExists,
  deactivateOwnAccount,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Strict rate limit on auth endpoints — protects against credential stuffing
// and brute-force attempts.
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.put("/reset-password/:token", authLimiter, resetPassword);

// Username / email / phone availability checks — public but rate-limited
// to prevent enumeration at scale.
router.get("/check-username/:username", authLimiter, checkUsername);
router.post("/check-email", authLimiter, checkEmailExists);
router.post("/check-phone", authLimiter, checkPhoneExists);

// ============ PROTECTED ROUTES ============
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/update-profile", protect, updateFullProfile);
router.put("/delivery-address", protect, updateDeliveryAddress);
router.put("/change-password", protect, changePassword);
router.put("/deactivate-account", protect, deactivateOwnAccount);

export default router;
