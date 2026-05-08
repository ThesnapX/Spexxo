import express from "express";
import {
  submitContact,
  getContacts,
} from "../controllers/contactController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", submitContact);
router.get("/", protect, admin, getContacts);

export default router;
