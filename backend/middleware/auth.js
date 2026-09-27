// backend/middleware/auth.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ─────────────────────────────────────────────
// Extract token from Authorization header or cookie.
// ─────────────────────────────────────────────
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const t = authHeader.slice(7).trim();
    if (t) return t;
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

// ─────────────────────────────────────────────
// Protect routes — requires a valid, active user.
// ─────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Do NOT log the token or its contents. Log only the reason.
      const reason =
        jwtError.name === "TokenExpiredError"
          ? "expired"
          : jwtError.name === "JsonWebTokenError"
            ? "invalid"
            : "verify_failed";
      console.warn(`[AUTH] Token rejected (${reason})`);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        code: reason,
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact support to reactivate.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Never expose error.stack or DB internals.
    console.error("[AUTH] Middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// ─────────────────────────────────────────────
// Admin middleware
// ─────────────────────────────────────────────
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Not authorized as admin",
  });
};

// ─────────────────────────────────────────────
// Optional auth — attaches req.user if a valid token exists,
// otherwise silently continues. Used for endpoints that serve
// both guests and logged-in users (e.g. Meta CAPI relay).
// ─────────────────────────────────────────────
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.id) {
      const user = await User.findById(decoded.id).select(
        "_id role email phone firstName lastName isActive",
      );
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // silent — optional
  }
  next();
};
