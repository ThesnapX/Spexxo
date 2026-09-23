// backend/utils/metaCapi.js

import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

// SHA-256 hash a value (required for user data fields)
const hash = (value) => {
  if (!value) return null;
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

export const getFbcFromRequest = (req) => {
  if (req.cookies?._fbc) return req.cookies._fbc;
  const fbclid = req.query?.fbclid || req.body?.fbclid;
  if (fbclid) {
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  return null;
};

export const getFbpFromRequest = (req) => {
  return req.cookies?._fbp || null;
};

export const sendMetaEvent = async ({
  eventName,
  eventId,
  userData = {},
  customData = {},
  eventSourceUrl,
  actionSource = "website",
  eventTime = Math.floor(Date.now() / 1000),
}) => {
  try {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.warn("[CAPI] Missing Meta credentials — skipping event");
      return { success: false, reason: "missing_credentials" };
    }

    // Build user_data
    const user_data = {};
    if (userData.email) user_data.em = [hash(userData.email)];
    if (userData.phone) user_data.ph = [hash(normalizePhone(userData.phone))];
    if (userData.firstName) user_data.fn = [hash(userData.firstName)];
    if (userData.lastName) user_data.ln = [hash(userData.lastName)];
    if (userData.city) user_data.ct = [hash(userData.city)];
    if (userData.state) user_data.st = [hash(userData.state)];
    if (userData.zip) user_data.zp = [hash(userData.zip)];
    if (userData.country) user_data.country = [hash(userData.country)];
    if (userData.externalId)
      user_data.external_id = [hash(userData.externalId)];
    if (userData.clientIpAddress)
      user_data.client_ip_address = userData.clientIpAddress;
    if (userData.clientUserAgent)
      user_data.client_user_agent = userData.clientUserAgent;
    if (userData.fbc) user_data.fbc = userData.fbc;
    if (userData.fbp) user_data.fbp = userData.fbp;

    // Build custom_data
    const custom_data = {};
    if (customData.value !== undefined) custom_data.value = customData.value;
    if (customData.currency) custom_data.currency = customData.currency;
    if (customData.contentIds) custom_data.content_ids = customData.contentIds;
    if (customData.contentType)
      custom_data.content_type = customData.contentType;
    if (customData.contents) custom_data.contents = customData.contents;
    if (customData.numItems !== undefined)
      custom_data.num_items = customData.numItems;
    if (customData.orderId) custom_data.order_id = customData.orderId;

    // Build payload
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

    // Add test code only in development
    if (TEST_EVENT_CODE && process.env.NODE_ENV !== "production") {
      payload.test_event_code = TEST_EVENT_CODE;
    }

    // Direct HTTP POST to Graph API (no SDK)
    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[CAPI] ❌ ${eventName} failed:`, result);
      return { success: false, error: result };
    }

    console.log(
      `[CAPI] ✅ ${eventName} sent (eventId: ${eventId}) — Meta received: ${result.events_received}`,
    );
    return { success: true, response: result };
  } catch (error) {
    console.error(`[CAPI] ❌ ${eventName} exception:`, error.message);
    return { success: false, error: error.message };
  }
};
