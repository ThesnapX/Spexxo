// frontend/src/config/siteUrl.js
//
// Single source of truth for the public site URL on the frontend.
//
// Set VITE_SITE_URL in your environment to flip to a custom domain.
// Fallback keeps you live today without breaking anything.
//
// Example .env:
//   VITE_SITE_URL=https://spexxo.com

const RAW = import.meta.env.VITE_SITE_URL || "";

// Strip trailing slashes.
const normalize = (url) => String(url || "").replace(/\/+$/, "");

const NORMALIZED = normalize(RAW);

// Dev-only warning so you know to set VITE_SITE_URL before a domain switch.
if (!NORMALIZED && import.meta.env.PROD) {
  // eslint-disable-next-line no-console
  console.warn(
    "[siteUrl] VITE_SITE_URL is not set. Falling back to https://spexxo.vercel.app. " +
      "Set VITE_SITE_URL in your deployment environment before switching to a custom domain.",
  );
}

export const SITE_URL = NORMALIZED || "https://spexxo.vercel.app";

/**
 * Build an absolute URL from a relative path.
 * @param {string} path   e.g. "/product/foo"
 * @returns {string}      e.g. "https://spexxo.vercel.app/product/foo"
 */
export const absoluteUrl = (path = "/") => {
  if (!path) return SITE_URL;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
};

export default SITE_URL;
