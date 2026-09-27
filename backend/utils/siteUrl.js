// backend/utils/siteUrl.js
//
// Single source of truth for the public site URL used in emails,
// sitemaps, Meta CAPI event_source_url, and structured data.

const RAW_SITE_URL = process.env.SITE_URL || process.env.FRONTEND_URL || "";

const normalize = (url) => String(url || "").replace(/\/+$/, "");

const SITE_URL = normalize(RAW_SITE_URL);

const isProduction = process.env.NODE_ENV === "production";

if (!SITE_URL && isProduction) {
  console.warn(
    "[siteUrl] ⚠️  SITE_URL / FRONTEND_URL is not set in production. " +
      "Falling back to https://spexxo.vercel.app. " +
      "Set SITE_URL to your canonical domain before going live on a custom domain.",
  );
}

export const SITE_URL_FINAL = SITE_URL || "https://spexxo.vercel.app";

export const absoluteUrl = (path = "/") => {
  if (!path) return SITE_URL_FINAL;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL_FINAL}${clean}`;
};

/**
 * Build a URL that MUST NOT fall back to localhost in production.
 * Throws in production if no URL is configured.
 *
 * @param {string} path e.g. "/reset-password/abc"
 * @returns {string}
 */
export const buildProductionUrl = (path = "/") => {
  const base = SITE_URL;

  if (!base) {
    if (isProduction) {
      const err = new Error(
        "FRONTEND_URL / SITE_URL is not configured. Refusing to generate " +
          "a URL in production — this would produce a localhost link.",
      );
      err.code = "MISSING_SITE_URL";
      throw err;
    }
    // Local dev only.
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `http://localhost:5173${clean}`;
  }

  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
};

export default SITE_URL_FINAL;
