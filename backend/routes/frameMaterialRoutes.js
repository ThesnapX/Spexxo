import express from "express";
import {
  getFrameMaterials,
  getFrameMaterial,
  createFrameMaterial,
  updateFrameMaterial,
  deleteFrameMaterial,
} from "../controllers/frameMaterialController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getFrameMaterials);
router.get("/:slug", getFrameMaterial);
router.post("/", protect, admin, createFrameMaterial);
router.put("/:id", protect, admin, updateFrameMaterial);
router.delete("/:id", protect, admin, deleteFrameMaterial);

export default router;
