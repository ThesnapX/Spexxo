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
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/check-username/:username", checkUsername);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/profile", protect, updateProfile);
router.put("/update-profile", protect, updateFullProfile);
router.put("/delivery-address", protect, updateDeliveryAddress);
router.put("/change-password", protect, changePassword);

export default router;
