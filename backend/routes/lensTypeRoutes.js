import express from "express";
import {
  getLensTypes,
  getLensType,
  createLensType,
  updateLensType,
  deleteLensType,
} from "../controllers/lensTypeController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getLensTypes);
router.get("/:slug", getLensType);
router.post("/", protect, admin, createLensType);
router.put("/:id", protect, admin, updateLensType);
router.delete("/:id", protect, admin, deleteLensType);

export default router;
