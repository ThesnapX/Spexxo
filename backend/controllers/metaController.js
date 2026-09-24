// backend/controllers/metaController.js

import {
  sendMetaEvent,
  getFbcFromRequest,
  getFbpFromRequest,
  ALLOWED_EVENTS,
} from "../utils/metaCapi.js";

// Simple in-memory dedup for repeated event IDs (per process)
// Prevents the same eventId from hitting Meta twice within 5 minutes.
const recentEventIds = new Map();
const DEDUP_TTL_MS = 5 * 60 * 1000;

const isDuplicate = (eventId) => {
  const now = Date.now();
  // Purge old entries opportunistically
  for (const [id, ts] of recentEventIds.entries()) {
    if (now - ts > DEDUP_TTL_MS) recentEventIds.delete(id);
  }
  if (recentEventIds.has(eventId)) return true;
  recentEventIds.set(eventId, now);
  return false;
};

// @desc   Receive browser event, forward to Meta CAPI
// @route  POST /api/meta/event
// @access Public (guests allowed — strict validation applied)
export const sendMetaEventController = async (req, res) => {
  try {
    const {
      eventName,
      eventId,
      customData = {},
      userData = {},
      eventSourceUrl,
    } = req.body;

    // ── Strict validation ──
    if (!eventName || typeof eventName !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "eventName required" });
    }

    if (!ALLOWED_EVENTS.has(eventName)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported event: ${eventName}`,
      });
    }

    if (!eventId || typeof eventId !== "string" || eventId.length > 100) {
      return res
        .status(400)
        .json({ success: false, message: "Valid eventId required" });
    }

    // Best-effort field sanity checks
    if (
      customData.value !== undefined &&
      customData.value !== null &&
      isNaN(Number(customData.value))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "customData.value must be numeric" });
    }

    if (customData.content_ids && !Array.isArray(customData.content_ids)) {
      return res.status(400).json({
        success: false,
        message: "customData.content_ids must be an array",
      });
    }

    // Idempotency guard — same eventId within TTL is silently accepted
    if (isDuplicate(eventId)) {
      console.log(`[CAPI] Dedup skip: ${eventName} | eventId=${eventId}`);
      return res.json({
        success: true,
        deduplicated: true,
        eventName,
        eventId,
      });
    }

    // ── Enrich user data ──
    const enrichedUserData = {
      ...userData,
      clientIpAddress:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip,
      clientUserAgent: req.headers["user-agent"],
      fbc: getFbcFromRequest(req),
      fbp: getFbpFromRequest(req),
    };

    // If authenticated, use the user's ID as external_id
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

    // Return the ACTUAL CAPI result so the frontend can distinguish states
    return res.json({
      success: result.success,
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
    return res.status(500).json({
      success: false,
      message: "Meta event ingestion failed",
    });
  }
};
