// backend/routes/subscriberRoutes.js

import express from "express";
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  deleteSubscriber,
  exportSubscribers,
} from "../controllers/subscriberController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// ============ PUBLIC ============
router.post("/", subscribe);
router.delete("/:email", unsubscribe);

// ============ ADMIN ============
// IMPORTANT: /export must come before /:id
router.get("/export", protect, admin, exportSubscribers);
router.get("/", protect, admin, getSubscribers);
router.delete("/admin/:id", protect, admin, deleteSubscriber);

export default router;
