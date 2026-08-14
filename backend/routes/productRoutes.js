import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/auth.js";
import { toggleProductStatus } from "../controllers/productController.js";
const router = express.Router();

// IMPORTANT: GET all products with filters - MUST come before /:slug
router.get("/", getProducts);

// GET single product by slug
router.get("/:slug", getProduct);

// Admin routes
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.put("/:id/toggle", protect, admin, toggleProductStatus);
export default router;
