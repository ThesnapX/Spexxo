// backend/routes/shippingRoutes.js

import express from "express";
import {
  getPincodeRules,
  createPincodeRule,
  updatePincodeRule,
  deletePincodeRule,
  deleteAllPincodeRules,
  bulkUploadPincodes,
  getUploadHistory,
  deleteUploadHistory,
  downloadTemplate,
  getSettings,
  updateSettings,
  calculateShipping,
  getShippingOptions,
  getFolders,
  deleteFolder,
  deleteSubFolder,
} from "../controllers/shippingController.js";
import { protect, admin } from "../middleware/auth.js";
import { csvUpload, handleCsvMulterError } from "../middleware/csvUpload.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
router.post("/calculate", calculateShipping);
router.post("/options", protect, getShippingOptions);

// ============ TEMPLATE DOWNLOAD ============
router.get("/template", protect, admin, downloadTemplate);

// ============ BULK UPLOAD ROUTES ============
router.post(
  "/bulk-upload",
  protect,
  admin,
  (req, res, next) => {
    csvUpload.single("file")(req, res, (err) => {
      if (err) {
        return handleCsvMulterError(err, req, res, next);
      }
      next();
    });
  },
  bulkUploadPincodes,
);

router.get("/bulk-upload/history", protect, admin, getUploadHistory);
router.delete("/bulk-upload/history/:id", protect, admin, deleteUploadHistory);

// ============ FOLDER ROUTES ============
router.get("/folders", protect, admin, getFolders);
router.delete("/folders/:folder", protect, admin, deleteFolder);
router.delete(
  "/subfolders/:folder/:subFolder",
  protect,
  admin,
  deleteSubFolder,
);

// ============ ADMIN ROUTES ============
// ✅ Updated to support search parameter
router.get("/pincodes", protect, admin, getPincodeRules);
router.post("/pincodes", protect, admin, createPincodeRule);
router.put("/pincodes/:id", protect, admin, updatePincodeRule);
router.delete("/pincodes/:id", protect, admin, deletePincodeRule);
router.delete("/pincodes", protect, admin, deleteAllPincodeRules);

router.get("/settings", protect, admin, getSettings);
router.put("/settings", protect, admin, updateSettings);

export default router;
