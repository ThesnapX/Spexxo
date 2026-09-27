// backend/routes/metaRoutes.js

import express from "express";
import { sendMetaEventController } from "../controllers/metaController.js";
import { metaLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// Public endpoint — accepts a strict allowlist of events, hashes user data
// server-side, and mirrors to Meta CAPI. Rate-limited aggressively to
// prevent spam from a runaway client.
router.post("/event", metaLimiter, sendMetaEventController);

export default router;
