import express from "express";
import {
  getActivePopups,
  getPopups,
  createPopup,
  updatePopup,
  deletePopup,
} from "../controllers/popupController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/active", getActivePopups);
router.get("/", protect, admin, getPopups);
router.post("/", protect, admin, createPopup);
router.put("/:id", protect, admin, updatePopup);
router.delete("/:id", protect, admin, deletePopup);

export default router;
