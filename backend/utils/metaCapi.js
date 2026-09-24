// backend/utils/metaCapi.js

import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
// Explicit opt-in test mode — never implicitly enabled by NODE_ENV
const TEST_MODE = process.env.META_CAPI_TEST_MODE === "true";
// Controlled API version — override via env if needed
const API_VERSION = process.env.META_CAPI_API_VERSION || "v21.0";

// ─────────────────────────────────────────────
// Hashing / normalisation
// ─────────────────────────────────────────────
const sha256 = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return crypto
    .createHash("sha256")
    .update(String(value).trim().toLowerCase())
    .digest("hex");
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

/**
 * Build Meta user_data object.
 * - Only hashes fields that Meta requires to be hashed.
 * - Never hashes twice — the caller must pass RAW values.
 */
const buildUserData = (userData = {}) => {
  const out = {};

  if (userData.email) out.em = [sha256(userData.email)];
  if (userData.phone) out.ph = [sha256(normalizePhone(userData.phone))];
  if (userData.firstName) out.fn = [sha256(userData.firstName)];
  if (userData.lastName) out.ln = [sha256(userData.lastName)];
  if (userData.city) out.ct = [sha256(userData.city)];
  if (userData.state) out.st = [sha256(userData.state)];
  if (userData.zip) out.zp = [sha256(userData.zip)];
  if (userData.country) out.country = [sha256(userData.country)];
  if (userData.externalId) out.external_id = [sha256(userData.externalId)];

  // Non-hashed browser/server context fields
  if (userData.clientIpAddress)
    out.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent)
    out.client_user_agent = userData.clientUserAgent;
  if (userData.fbc) out.fbc = userData.fbc;
  if (userData.fbp) out.fbp = userData.fbp;

  // Drop null hash entries
  Object.keys(out).forEach((k) => {
    const v = out[k];
    if (Array.isArray(v) && v[0] === null) delete out[k];
  });

  return out;
};

/**
 * Build Meta custom_data object — strict naming.
 * Accepts camelCase or snake_case from the frontend and normalises.
 */
const buildCustomData = (customData = {}) => {
  const out = {};

  const value = customData.value;
  if (value !== undefined && value !== null && !isNaN(Number(value))) {
    out.value = Number(value);
  }

  if (customData.currency) out.currency = String(customData.currency);

  const contentIds = customData.content_ids || customData.contentIds;
  if (Array.isArray(contentIds) && contentIds.length > 0) {
    out.content_ids = contentIds.filter(Boolean);
  }

  if (customData.content_type || customData.contentType) {
    out.content_type = customData.content_type || customData.contentType;
  }

  if (customData.content_name || customData.contentName) {
    out.content_name = customData.content_name || customData.contentName;
  }

  if (Array.isArray(customData.contents) && customData.contents.length > 0) {
    out.contents = customData.contents
      .filter((c) => c && (c.id || c.item_price !== undefined))
      .map((c) => ({
        id: String(c.id),
        quantity: Number(c.quantity || 1),
        item_price: Number(c.item_price ?? c.price ?? 0),
      }));
  }

  const numItems = customData.num_items ?? customData.numItems;
  if (numItems !== undefined && numItems !== null) {
    out.num_items = Number(numItems);
  }

  const orderId = customData.order_id || customData.orderId;
  if (orderId) out.order_id = String(orderId);

  return out;
};

// ─────────────────────────────────────────────
// Request-scoped attribution extraction
// ─────────────────────────────────────────────
export const getFbcFromRequest = (req) => {
  // Priority 1: explicit body value (from frontend cookie read)
  const bodyFbc = req.body?.userData?.fbc || req.body?.fbc;
  if (bodyFbc) return bodyFbc;

  // Priority 2: existing cookie
  if (req.cookies?._fbc) return req.cookies._fbc;

  // Priority 3: construct from fbclid query
  const fbclid = req.query?.fbclid || req.body?.fbclid;
  if (fbclid) {
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  return null;
};

export const getFbpFromRequest = (req) => {
  const bodyFbp = req.body?.userData?.fbp || req.body?.fbp;
  if (bodyFbp) return bodyFbp;
  return req.cookies?._fbp || null;
};

// ─────────────────────────────────────────────
// Send event to Meta
// ─────────────────────────────────────────────
export const sendMetaEvent = async ({
  eventName,
  eventId,
  userData = {},
  customData = {},
  eventSourceUrl,
  actionSource = "website",
  eventTime = Math.floor(Date.now() / 1000),
}) => {
  // Validate credentials
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[CAPI] Missing Meta credentials — event dropped:", {
      eventName,
      eventId,
      hasPixelId: !!PIXEL_ID,
      hasToken: !!ACCESS_TOKEN,
    });
    return {
      success: false,
      reason: "missing_credentials",
      eventName,
      eventId,
    };
  }

  try {
    const user_data = buildUserData(userData);
    const custom_data = buildCustomData(customData);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          event_id: eventId,
          action_source: actionSource,
          event_source_url: eventSourceUrl,
          user_data,
          custom_data,
        },
      ],
    };

    // Test mode — explicit opt-in only
    if (TEST_MODE && TEST_EVENT_CODE) {
      payload.test_event_code = TEST_EVENT_CODE;
      console.log(
        `[CAPI] ⚠️  TEST MODE ACTIVE — attaching test_event_code for ${eventName}`,
      );
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      result = { raw: "Non-JSON response" };
    }

    if (!response.ok) {
      console.error(`[CAPI] ❌ ${eventName} failed:`, {
        eventId,
        status: response.status,
        error: result?.error?.message || "unknown",
        errorCode: result?.error?.code,
        errorSubcode: result?.error?.error_subcode,
      });
      return {
        success: false,
        status: response.status,
        error: result?.error || result,
        eventName,
        eventId,
      };
    }

    console.log(
      `[CAPI] ✅ ${eventName} sent | eventId=${eventId} | received=${result.events_received ?? "?"}`,
    );

    return {
      success: true,
      eventsReceived: result.events_received,
      fbtraceId: result.fbtrace_id,
      eventName,
      eventId,
    };
  } catch (error) {
    console.error(`[CAPI] ❌ ${eventName} exception:`, {
      eventId,
      message: error.message,
    });
    return {
      success: false,
      reason: "network_error",
      error: error.message,
      eventName,
      eventId,
    };
  }
};

// ─────────────────────────────────────────────
// Allowlist of accepted event names
// ─────────────────────────────────────────────
export const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Search",
  "AddToWishlist",
  "Contact",
  "Lead",
  "CompleteRegistration",
]);
