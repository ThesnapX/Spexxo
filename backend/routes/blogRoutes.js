// backend/routes/blogRoutes.js

import express from "express";
import {
  getBlogs,
  getBlog,
  getAdminBlogs,
  getAdminBlogById,
  checkSeoScore,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
} from "../controllers/blogController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
router.get("/", getBlogs);
router.get("/categories", getBlogCategories);
router.get("/tags", getBlogTags);

// ============ ADMIN ROUTES (must come before /:slug) ============
router.get("/admin/all", protect, admin, getAdminBlogs);
router.get("/admin/:id", protect, admin, getAdminBlogById);
router.post("/seo-check", protect, admin, checkSeoScore);

// Category admin routes
router.post("/categories", protect, admin, createBlogCategory);
router.put("/categories/:id", protect, admin, updateBlogCategory);
router.delete("/categories/:id", protect, admin, deleteBlogCategory);

// Tag admin routes
router.post("/tags", protect, admin, createBlogTag);
router.put("/tags/:id", protect, admin, updateBlogTag);
router.delete("/tags/:id", protect, admin, deleteBlogTag);

// Blog CRUD
router.post("/", protect, admin, createBlog);
router.put("/:id", protect, admin, updateBlog);
router.delete("/:id", protect, admin, deleteBlog);
router.put("/:id/toggle-status", protect, admin, toggleBlogStatus);

// ============ PUBLIC SINGLE BLOG (must come last) ============
router.get("/:slug", getBlog);

export default router;
