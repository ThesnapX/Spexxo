import express from "express";
import {
  getShapes,
  getShape,
  createShape,
  updateShape,
  deleteShape,
} from "../controllers/shapeController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getShapes);
router.get("/:slug", getShape);
router.post("/", protect, admin, createShape);
router.put("/:id", protect, admin, updateShape);
router.delete("/:id", protect, admin, deleteShape);

export default router;
