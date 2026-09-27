// frontend/src/utils/seoHelpers.js

import { SITE_URL } from "../config/siteUrl";

/**
 * Truncate a description to `max` characters without cutting mid-word.
 * Appends an ellipsis if the text was cut.
 */
export const smartTruncate = (text, max = 160) => {
  if (!text) return "";
  const clean = String(text)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trim()}…`;
};

/**
 * Pick the best image URL for OG/structured-data previews.
 * Prefers an explicit URL; falls back to a default OG image.
 */
export const resolveOgImage = (explicitUrl) => {
  if (explicitUrl && typeof explicitUrl === "string" && explicitUrl.trim()) {
    return explicitUrl.trim();
  }
  return `${SITE_URL}/favicon.png`;
};

/**
 * Build BreadcrumbList-ready array from a list of { name, path } pairs.
 * The path is converted to an absolute URL.
 */
export const buildBreadcrumbs = (items = []) =>
  items.map((it) => ({
    name: it.name,
    item: it.path.startsWith("http")
      ? it.path
      : `${SITE_URL}${it.path.startsWith("/") ? "" : "/"}${it.path}`,
  }));

/**
 * Build the canonical URL for a path.
 * Strips the query string for cleanliness.
 */
export const buildCanonical = (path) => {
  if (!path) return `${SITE_URL}/`;
  const clean = path.split("?")[0];
  return `${SITE_URL}${clean.startsWith("/") ? "" : "/"}${clean}`;
};
