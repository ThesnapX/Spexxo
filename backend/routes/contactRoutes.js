// backend/routes/contactRoutes.js

import express from "express";
import {
  submitContact,
  getContacts,
  getUnreadCount,
  markContactRead,
  deleteContact,
} from "../controllers/contactController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// ============ PUBLIC ============
router.post("/", submitContact);

// ============ ADMIN ============
// IMPORTANT: /unread-count must come before /:id
router.get("/unread-count", protect, admin, getUnreadCount);
router.get("/", protect, admin, getContacts);
router.put("/:id/read", protect, admin, markContactRead);
router.delete("/:id", protect, admin, deleteContact);

export default router;
