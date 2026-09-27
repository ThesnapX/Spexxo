// backend/controllers/metaController.js

import {
  sendMetaEvent,
  getFbcFromRequest,
  getFbpFromRequest,
  ALLOWED_EVENTS,
} from "../utils/metaCapi.js";

// ─────────────────────────────────────────────
// In-memory dedup for repeated event IDs (per process).
//
// ⚠️ This is a best-effort optimization, NOT the primary dedup layer.
// Meta's own dedup on (pixel_id, event_name, event_id) inside a 48h window
// is what guarantees no duplicate conversions.
//
// On multi-dyno / serverless deployments this map is per-instance, so
// identical event_ids arriving at different instances will both reach Meta.
// Meta will still collapse them into one conversion.
// ─────────────────────────────────────────────
const recentEventIds = new Map();
const DEDUP_TTL_MS = 5 * 60 * 1000;

const isDuplicate = (eventId) => {
  const now = Date.now();
  for (const [id, ts] of recentEventIds.entries()) {
    if (now - ts > DEDUP_TTL_MS) recentEventIds.delete(id);
  }
  if (recentEventIds.has(eventId)) return true;
  recentEventIds.set(eventId, now);
  return false;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const isFiniteNonNegative = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

// Safely accept only primitive user data fields.
const sanitizeUserData = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  const stringFields = [
    "email",
    "phone",
    "firstName",
    "lastName",
    "city",
    "state",
    "zip",
    "country",
    "externalId",
    "fbc",
    "fbp",
  ];
  for (const k of stringFields) {
    const v = raw[k];
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = v.trim();
    }
  }
  return out;
};

// Best-effort rejection response that returns 200 so the client does not retry.
const reject = (res, reason, extra = {}) =>
  res.status(200).json({
    success: false,
    meta: { reason },
    ...extra,
  });

// ─────────────────────────────────────────────
// Main controller
// ─────────────────────────────────────────────
export const sendMetaEventController = async (req, res) => {
  try {
    const {
      eventName,
      eventId,
      customData = {},
      userData = {},
      eventSourceUrl,
    } = req.body || {};

    // ── Validate event name against allowlist. ──
    if (!eventName || typeof eventName !== "string") {
      return reject(res, "missing_event_name");
    }
    if (!ALLOWED_EVENTS.has(eventName)) {
      return reject(res, "unsupported_event", { eventName });
    }

    // ── Validate eventId. ──
    if (
      !eventId ||
      typeof eventId !== "string" ||
      eventId.length === 0 ||
      eventId.length > 100
    ) {
      return reject(res, "invalid_event_id", { eventName });
    }

    // ── Validate customData numeric fields. ──
    if (
      customData.value !== undefined &&
      customData.value !== null &&
      !isFiniteNonNegative(customData.value)
    ) {
      return reject(res, "invalid_value", { eventName });
    }

    if (customData.content_ids && !Array.isArray(customData.content_ids)) {
      return reject(res, "invalid_content_ids", { eventName });
    }

    if (
      customData.contents !== undefined &&
      !Array.isArray(customData.contents)
    ) {
      return reject(res, "invalid_contents", { eventName });
    }

    // ── Idempotency guard (per-process best-effort). ──
    if (isDuplicate(eventId)) {
      console.log(`[CAPI] Dedup skip: ${eventName} | eventId=${eventId}`);
      return res.json({
        success: true,
        deduplicated: true,
        eventName,
        eventId,
      });
    }

    // ── Enrich user data from the request itself. ──
    const sanitizedUser = sanitizeUserData(userData);

    const enrichedUserData = {
      ...sanitizedUser,
      clientIpAddress:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip,
      clientUserAgent: req.headers["user-agent"],
      fbc: sanitizedUser.fbc || getFbcFromRequest(req),
      fbp: sanitizedUser.fbp || getFbpFromRequest(req),
    };

    // If authenticated, trust the server-side user over anything from the browser.
    if (req.user?._id) {
      enrichedUserData.externalId = req.user._id.toString();
      if (req.user.email && !enrichedUserData.email)
        enrichedUserData.email = req.user.email;
      if (req.user.phone && !enrichedUserData.phone)
        enrichedUserData.phone = req.user.phone;
      if (req.user.firstName && !enrichedUserData.firstName)
        enrichedUserData.firstName = req.user.firstName;
      if (req.user.lastName && !enrichedUserData.lastName)
        enrichedUserData.lastName = req.user.lastName;
    }

    const result = await sendMetaEvent({
      eventName,
      eventId,
      userData: enrichedUserData,
      customData,
      eventSourceUrl: eventSourceUrl || req.headers.referer,
    });

    return res.json({
      success: !!result.success,
      eventName,
      eventId,
      meta: result.success
        ? {
            eventsReceived: result.eventsReceived,
            fbtraceId: result.fbtraceId,
          }
        : {
            reason: result.reason || "meta_error",
            status: result.status,
            errorCode: result.error?.code,
            errorMessage: result.error?.message,
          },
    });
  } catch (error) {
    console.error("[META CTRL] Error:", error.message);
    // Return 200 with success:false to avoid client retry storms.
    return res.status(200).json({
      success: false,
      meta: { reason: "internal_error" },
    });
  }
};
