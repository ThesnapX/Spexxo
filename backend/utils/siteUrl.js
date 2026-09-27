// backend/utils/siteUrl.js
//
// Single source of truth for the public site URL used in emails,
// sitemaps, Meta CAPI event_source_url, and structured data.
//
// Priority:
//   1. SITE_URL          (explicit override — preferred in production)
//   2. FRONTEND_URL      (already used across the codebase)
//   3. Public fallback   (dev only — never used if SITE_URL is set)
//
// IMPORTANT:
//   This module is intentionally backend-only. Frontend gets its own
//   equivalent via VITE_SITE_URL (see frontend/src/config/siteUrl.js
//   delivered later in Phase 1).

const RAW_SITE_URL = process.env.SITE_URL || process.env.FRONTEND_URL || "";

// Strip trailing slashes so `${SITE_URL}/path` never becomes `//path`.
const normalize = (url) => String(url || "").replace(/\/+$/, "");

const SITE_URL = normalize(RAW_SITE_URL);

// Dev-only fallback. In production we want a loud warning rather than
// silently emitting localhost links into customer emails / Meta events.
const isProduction = process.env.NODE_ENV === "production";

if (!SITE_URL && isProduction) {
  console.warn(
    "[siteUrl] ⚠️  SITE_URL / FRONTEND_URL is not set in production. " +
      "Falling back to https://spexxo.vercel.app. " +
      "Set SITE_URL to your canonical domain before going live on a custom domain.",
  );
}

export const SITE_URL_FINAL = SITE_URL || "https://spexxo.vercel.app";

/**
 * Build an absolute URL from a relative path.
 * @param {string} path  e.g. "/product/foo" or "product/foo"
 * @returns {string}     e.g. "https://spexxo.vercel.app/product/foo"
 */
export const absoluteUrl = (path = "/") => {
  if (!path) return SITE_URL_FINAL;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL_FINAL}${clean}`;
};

export default SITE_URL_FINAL;
