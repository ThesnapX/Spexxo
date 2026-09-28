// backend/utils/metaCapi.js

import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const TEST_MODE = process.env.META_CAPI_TEST_MODE === "true";
const API_VERSION = process.env.META_CAPI_API_VERSION || "v21.0";

// ─────────────────────────────────────────────
// Normalisation + hashing
// ─────────────────────────────────────────────
const sha256 = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return crypto
    .createHash("sha256")
    .update(String(value).trim().toLowerCase())
    .digest("hex");
};

// Meta wants digits only. We normalize Indian numbers to 91XXXXXXXXXX.
// Any non-digit is stripped. If 10 digits → prefix 91. If 12 digits
// starting with 91 → keep. Otherwise pass through digits as-is.
const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0"))
    return `91${digits.slice(1)}`;
  return digits;
};

// Meta expects first/last names as lowercase, trimmed, no punctuation.
const normalizeName = (name) => {
  if (!name) return null;
  const cleaned = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z\u0900-\u097F\s]/g, "") // keep letters incl. Devanagari
    .replace(/\s+/g, " ");
  return cleaned || null;
};

// Meta wants lowercase city/state without spaces or punctuation.
const normalizeCityState = (value) => {
  if (!value) return null;
  const cleaned = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return cleaned || null;
};

// Meta wants country as a 2-letter ISO code, lowercase.
const normalizeCountry = (value) => {
  if (!value) return "in";
  const c = String(value).trim().toLowerCase();
  if (c.length === 2) return c;
  // Map common full names → ISO.
  const map = {
    india: "in",
    "united states": "us",
    usa: "us",
    "united kingdom": "gb",
    uk: "gb",
  };
  return map[c] || c.slice(0, 2);
};

// ─────────────────────────────────────────────
// Build Meta user_data with Advanced Matching
// ─────────────────────────────────────────────
const buildUserData = (userData = {}) => {
  const out = {};

  // Hashed PII
  const email = userData.email ? sha256(userData.email) : null;
  const phone = userData.phone ? sha256(normalizePhone(userData.phone)) : null;
  const fn = userData.firstName
    ? sha256(normalizeName(userData.firstName))
    : null;
  const ln = userData.lastName
    ? sha256(normalizeName(userData.lastName))
    : null;
  const ct = userData.city ? sha256(normalizeCityState(userData.city)) : null;
  const st = userData.state ? sha256(normalizeCityState(userData.state)) : null;
  const zp = userData.zip ? sha256(String(userData.zip).trim()) : null;
  const country = userData.country
    ? sha256(normalizeCountry(userData.country))
    : null;
  const externalId = userData.externalId
    ? sha256(String(userData.externalId))
    : null;

  // Meta expects arrays. Only attach keys with non-null values.
  if (email) out.em = [email];
  if (phone) out.ph = [phone];
  if (fn) out.fn = [fn];
  if (ln) out.ln = [ln];
  if (ct) out.ct = [ct];
  if (st) out.st = [st];
  if (zp) out.zp = [zp];
  if (country) out.country = [country];
  if (externalId) out.external_id = [externalId];

  // Non-hashed browser/server context.
  if (userData.clientIpAddress)
    out.client_ip_address = userData.clientIpAddress;
  if (userData.clientUserAgent)
    out.client_user_agent = userData.clientUserAgent;
  if (userData.fbc) out.fbc = userData.fbc;
  if (userData.fbp) out.fbp = userData.fbp;

  // Drop empty-array keys defensively.
  Object.keys(out).forEach((k) => {
    const v = out[k];
    if (Array.isArray(v) && v.length === 0) delete out[k];
  });

  return out;
};

// ─────────────────────────────────────────────
// custom_data builder (unchanged semantics)
// ─────────────────────────────────────────────
const isFiniteNonNegative = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

const buildCustomData = (customData = {}) => {
  const out = {};

  const value = customData.value;
  if (value !== undefined && value !== null) {
    const n = Number(value);
    if (isFiniteNonNegative(n) && n <= 1_000_000_000) {
      out.value = Math.round(n * 100) / 100;
    }
  }

  if (customData.currency) out.currency = String(customData.currency);

  const contentIds = customData.content_ids || customData.contentIds;
  if (Array.isArray(contentIds) && contentIds.length > 0) {
    out.content_ids = contentIds
      .map((id) => (id === null || id === undefined ? null : String(id)))
      .filter(Boolean)
      .slice(0, 50);
  }

  if (customData.content_type || customData.contentType) {
    out.content_type = customData.content_type || customData.contentType;
  }

  if (customData.content_name || customData.contentName) {
    out.content_name = customData.content_name || customData.contentName;
  }

  if (Array.isArray(customData.contents) && customData.contents.length > 0) {
    out.contents = customData.contents
      .map((c) => {
        if (!c) return null;
        const id = c.id ? String(c.id) : null;
        const q = Number(c.quantity);
        const p = Number(c.item_price ?? c.price);
        if (!id) return null;
        if (!Number.isFinite(q) || q <= 0) return null;
        if (!isFiniteNonNegative(p)) return null;
        return {
          id,
          quantity: q,
          item_price: Math.round(p * 100) / 100,
        };
      })
      .filter(Boolean)
      .slice(0, 50);
  }

  const numItems = customData.num_items ?? customData.numItems;
  if (numItems !== undefined && numItems !== null) {
    const n = Number(numItems);
    if (Number.isFinite(n) && n >= 0) out.num_items = Math.floor(n);
  }

  const orderId = customData.order_id || customData.orderId;
  if (orderId) out.order_id = String(orderId).slice(0, 100);

  return out;
};

// ─────────────────────────────────────────────
// Request-scoped attribution extraction
// ─────────────────────────────────────────────
export const getFbcFromRequest = (req) => {
  const bodyFbc = req.body?.userData?.fbc || req.body?.fbc;
  if (bodyFbc) return bodyFbc;
  if (req.cookies?._fbc) return req.cookies._fbc;
  const fbclid = req.query?.fbclid || req.body?.fbclid;
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
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
  if (!eventId || typeof eventId !== "string" || eventId.length > 100) {
    return {
      success: false,
      reason: "invalid_event_id",
      eventName,
      eventId,
    };
  }

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

    // Diagnostic: how many hashed user_data fields we actually sent.
    const matchingFields = Object.keys(user_data).filter((k) =>
      [
        "em",
        "ph",
        "fn",
        "ln",
        "ct",
        "st",
        "zp",
        "country",
        "external_id",
      ].includes(k),
    );

    console.log(
      `[CAPI] ✅ ${eventName} sent | eventId=${eventId} | received=${
        result.events_received ?? "?"
      } | matchFields=[${matchingFields.join(",")}]`,
    );

    return {
      success: true,
      eventsReceived: result.events_received,
      fbtraceId: result.fbtrace_id,
      eventName,
      eventId,
      matchedFields: matchingFields,
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
