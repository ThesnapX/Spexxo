import express from "express";
import {
  validateCoupon,
  applyCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.post("/validate", validateCoupon);
router.post("/apply", protect, applyCoupon);
router.get("/", protect, admin, getCoupons);
router.post("/", protect, admin, createCoupon);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

export default router;
