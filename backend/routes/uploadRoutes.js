// backend/routes/uploadRoutes.js

import express from "express";
import {
  uploadImage,
  uploadMultipleImages,
} from "../controllers/uploadController.js";
import { protect, admin } from "../middleware/auth.js";
import { upload, handleMulterError } from "../middleware/upload.js";

const router = express.Router();

// Single image upload with error handling
router.post(
  "/single",
  protect,
  admin,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  uploadImage,
);

// Multiple images upload with error handling
router.post(
  "/multiple",
  protect,
  admin,
  (req, res, next) => {
    upload.array("images", 10)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  uploadMultipleImages,
);

export default router;
