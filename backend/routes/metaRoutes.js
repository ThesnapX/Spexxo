// backend/routes/metaRoutes.js

import express from "express";
import rateLimit from "express-rate-limit";
import { sendMetaEventController } from "../controllers/metaController.js";

const router = express.Router();

// Strict rate limit for the public Meta ingestion endpoint
const metaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 events / min / IP is plenty for a normal session
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many tracking events" },
});

router.post("/event", metaLimiter, sendMetaEventController);

export default router;
