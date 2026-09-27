// backend/middleware/rateLimiters.js

import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";
const skipLocal = (req) =>
  isDev && (req.ip === "::1" || req.ip === "127.0.0.1");

// ─────────────────────────────────────────────
// Auth endpoints — login, register, password reset.
// Strict: 10 attempts per 15 min per IP.
// ─────────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocal,
});

// ─────────────────────────────────────────────
// Order creation — 30 per 10 min per IP.
// ─────────────────────────────────────────────
export const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 500 : 30,
  message: {
    success: false,
    message: "Too many order attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocal,
});

// ─────────────────────────────────────────────
// Payment endpoints — 30 per 10 min per IP.
// ─────────────────────────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 500 : 30,
  message: {
    success: false,
    message: "Too many payment attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocal,
});

// ─────────────────────────────────────────────
// Meta CAPI relay — already rate-limited in metaRoutes.js.
// Keep that file as-is; this is a convenience export.
// ─────────────────────────────────────────────
export const metaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 2000 : 120,
  message: { success: false, message: "Too many tracking events" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocal,
});
