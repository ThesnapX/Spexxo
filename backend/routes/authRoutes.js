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
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get("/check-username/:username", checkUsername);
router.post("/check-email", checkEmailExists);
router.post("/check-phone", checkPhoneExists);

// Protected routes
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/update-profile", protect, updateFullProfile);
router.put("/delivery-address", protect, updateDeliveryAddress);
router.put("/change-password", protect, changePassword);

export default router;
