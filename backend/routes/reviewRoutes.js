import express from "express";
import {
  getProductReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
  replyToReview,
} from "../controllers/reviewController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/:productId", getProductReviews);

// Admin routes
router.get("/all", protect, admin, getAllReviews);
router.put("/:id/toggle", protect, admin, toggleReviewVisibility);
router.put("/:id/reply", protect, admin, replyToReview);

// Protected routes (user)
router.post("/:productId", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;
