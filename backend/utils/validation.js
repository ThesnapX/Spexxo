// backend/utils/validation.js

import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────
export const clampPagination = (
  pageRaw,
  limitRaw,
  { defaultLimit = 12, maxLimit = 100 } = {},
) => {
  const page = Math.max(parseInt(pageRaw, 10) || 1, 1);
  const limitRawNum = parseInt(limitRaw, 10) || defaultLimit;
  const limit = Math.min(Math.max(limitRawNum, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

// ─────────────────────────────────────────────
// Escape regex meta-characters in user search.
// Prevents ReDoS and unintended wildcards.
// ─────────────────────────────────────────────
export const escapeRegex = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─────────────────────────────────────────────
// Sanitize a search string:
//   - trim
//   - cap length (default 100)
//   - escape regex
// Returns null if empty after trimming.
// ─────────────────────────────────────────────
export const sanitizeSearch = (raw, maxLength = 100) => {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const capped = trimmed.slice(0, maxLength);
  return escapeRegex(capped);
};

// ─────────────────────────────────────────────
// ObjectId validation
// ─────────────────────────────────────────────
export const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(String(id || ""));

// ─────────────────────────────────────────────
// Numeric query param
// ─────────────────────────────────────────────
export const parseFiniteNumber = (raw, fallback = null) => {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

// ─────────────────────────────────────────────
// Comma-separated list sanitizer.
// Caps total items, trims each, drops empties.
// ─────────────────────────────────────────────
export const parseCsvList = (raw, { maxItems = 30, maxLen = 60 } = {}) => {
  if (!raw) return [];
  const items = String(raw)
    .split(",")
    .map((s) => s.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
  return [...new Set(items)];
};

// ─────────────────────────────────────────────
// Sort whitelist
// ─────────────────────────────────────────────
export const pickSort = (raw, whitelist) => {
  if (!raw) return null;
  return whitelist.includes(raw) ? raw : null;
};
