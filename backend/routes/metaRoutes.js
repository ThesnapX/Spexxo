// backend/routes/metaRoutes.js

import express from "express";
import { sendMetaEventController } from "../controllers/metaController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Optional auth — works for guests too, but will attach user ID if logged in
router.post("/event", protect, sendMetaEventController);

export default router;
