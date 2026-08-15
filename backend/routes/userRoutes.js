import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  addAddress,
  updateAddress,
  deleteAddress,
  deactivateUser,
  reactivateUser,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// ============ ADMIN ROUTES ============
router.get("/", protect, admin, getUsers);
router.get("/:id", protect, admin, getUser);
router.put("/:id", protect, admin, updateUser);
router.delete("/:id", protect, admin, deleteUser);
router.put("/:id/deactivate", protect, admin, deactivateUser);
router.put("/:id/reactivate", protect, admin, reactivateUser);

// ============ ADDRESS ROUTES (Protected) ============
router.post("/address", protect, addAddress);
router.put("/address/:addressId", protect, updateAddress);
router.delete("/address/:addressId", protect, deleteAddress);

export default router;
