import express from "express";
import {
  getColors,
  getColor,
  createColor,
  updateColor,
  deleteColor,
} from "../controllers/colorController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getColors);
router.get("/:slug", getColor);
router.post("/", protect, admin, createColor);
router.put("/:id", protect, admin, updateColor);
router.delete("/:id", protect, admin, deleteColor);

export default router;
