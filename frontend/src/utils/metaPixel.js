// frontend/src/utils/metaPixel.js

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1753741932563893";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─────────────────────────────────────────────
// Event ID generation
// ─────────────────────────────────────────────
export const generateEventId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `evt_${ts}_${rand}`;
};

// ─────────────────────────────────────────────
// Safe numeric normalization
// ─────────────────────────────────────────────
// Returns a finite non-negative number, or null.
// Never returns NaN / Infinity / negative.
const safeMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
};

// ─────────────────────────────────────────────
// Cookie helpers
// ─────────────────────────────────────────────
const readCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
};

const writeCookie = (name, value, maxAgeSeconds = 60 * 60 * 24 * 90) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};

/**
 * Capture fbclid from the URL and persist as _fbc if not already present.
 * Safe to call on every mount — it becomes a no-op after the first capture.
 */
export const captureFbclid = () => {
  try {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get("fbclid");
    if (!fbclid) return;

    const existing = readCookie("_fbc");
    if (existing && existing.startsWith("fb.")) return;

    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    writeCookie("_fbc", fbc);
    // eslint-disable-next-line no-console
    console.log("[Meta] Captured fbclid → _fbc persisted");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[Meta] fbclid capture failed:", err.message);
  }
};

export const getFbp = () => readCookie("_fbp");
export const getFbc = () => readCookie("_fbc");

// ─────────────────────────────────────────────
// Core event dispatcher
// ─────────────────────────────────────────────
/**
 * Fires a Meta event via Browser Pixel AND CAPI, sharing one event_id.
 *
 * @param {object} args
 * @param {string} args.eventName
 * @param {object} [args.customData]
 * @param {object} [args.userData]
 * @param {string} [args.eventId]
 * @returns {Promise<{eventId:string, browserFired:boolean, capiResult:any}>}
 */
export const trackMetaEvent = async ({
  eventName,
  customData = {},
  userData = {},
  eventId: providedEventId,
}) => {
  const eventId = providedEventId || generateEventId();

  // ── Sanitize customData value if present ──
  if ("value" in customData) {
    const v = safeMoney(customData.value);
    customData = { ...customData, value: v };
    if (v === null) {
      // Remove invalid value entirely rather than send null.
      delete customData.value;
    }
  }

  // ── Sanitize contents if present ──
  if (Array.isArray(customData.contents)) {
    customData = {
      ...customData,
      contents: customData.contents
        .map((c) => {
          const id = c?.id ? String(c.id) : null;
          const q = Number(c?.quantity);
          const p = safeMoney(c?.item_price);
          if (!id) return null;
          if (!Number.isFinite(q) || q <= 0) return null;
          if (p === null) return null;
          return { id, quantity: q, item_price: p };
        })
        .filter(Boolean),
    };
    if (customData.contents.length === 0) {
      delete customData.contents;
    }
  }

  // ── Browser pixel ──
  let browserFired = false;
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", eventName, customData, { eventID: eventId });
      browserFired = true;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[Meta] fbq failed for ${eventName}:`, err.message);
  }

  // ── CAPI (server relay) ──
  const enrichedUserData = {
    ...userData,
    fbp: getFbp(),
    fbc: getFbc(),
  };

  let capiResult = null;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/meta/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventName,
        eventId,
        customData,
        userData: enrichedUserData,
        eventSourceUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
      }),
    });
    capiResult = await res.json().catch(() => null);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[Meta] CAPI failed for ${eventName}:`, err.message);
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[Meta] ${eventName}`, {
      eventId,
      browserFired,
      capi: capiResult
        ? capiResult.success
          ? `✅ received=${capiResult.meta?.eventsReceived ?? "?"}`
          : `❌ ${capiResult.meta?.reason || "error"}`
        : "no response",
    });
  }

  return { eventId, browserFired, capiResult };
};

// ─────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────
export const trackViewContent = (product) => {
  if (!product?._id) return Promise.resolve();

  const productPrice = Number(product.price) || 0;
  const comparePrice = Number(product.comparePrice) || 0;
  const sellingPrice =
    comparePrice > 0 && comparePrice < productPrice
      ? comparePrice
      : productPrice;

  const value = safeMoney(sellingPrice);
  if (value === null) return Promise.resolve();

  return trackMetaEvent({
    eventName: "ViewContent",
    customData: {
      content_ids: [String(product._id)],
      content_type: "product",
      content_name: product.name,
      value,
      currency: "INR",
    },
  });
};

export const trackAddToCart = (product, quantity = 1, variant = null) => {
  if (!product?._id) return Promise.resolve();

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return Promise.resolve();

  // Use variant price when available — matches what the user actually pays.
  const productPrice = Number(product.price) || 0;
  const comparePrice = Number(product.comparePrice) || 0;
  const productSelling =
    comparePrice > 0 && comparePrice < productPrice
      ? comparePrice
      : productPrice;

  const unitPrice = safeMoney(variant?.price ?? productSelling);
  if (unitPrice === null) return Promise.resolve();

  const value = safeMoney(unitPrice * qty);
  if (value === null) return Promise.resolve();

  return trackMetaEvent({
    eventName: "AddToCart",
    customData: {
      content_ids: [String(product._id)],
      content_type: "product",
      contents: [
        {
          id: String(product._id),
          quantity: qty,
          item_price: unitPrice,
        },
      ],
      value,
      currency: "INR",
    },
  });
};

export const trackInitiateCheckout = ({ items, value, numItems }) => {
  if (!Array.isArray(items) || items.length === 0) return Promise.resolve();

  const contents = items
    .map((it) => {
      const id = it.productId || it.product?._id || it.id;
      const q = Number(it.quantity);
      const p = safeMoney(it.price ?? it.item_price);
      if (!id) return null;
      if (!Number.isFinite(q) || q <= 0) return null;
      if (p === null) return null;
      return { id: String(id), quantity: q, item_price: p };
    })
    .filter(Boolean);

  if (contents.length === 0) return Promise.resolve();

  const safeValue = safeMoney(value);
  const computedNumItems =
    Number.isFinite(Number(numItems)) && Number(numItems) > 0
      ? Number(numItems)
      : contents.reduce((s, c) => s + c.quantity, 0);

  const payload = {
    content_ids: contents.map((c) => c.id),
    content_type: "product",
    contents,
    num_items: computedNumItems,
    currency: "INR",
  };
  if (safeValue !== null) payload.value = safeValue;

  return trackMetaEvent({
    eventName: "InitiateCheckout",
    customData: payload,
  });
};

/**
 * Purchase — receives the confirmed order from the server.
 * Uses the order's persisted purchaseEventId so browser + CAPI dedupe.
 * Never fires twice for the same order.
 */
export const trackPurchase = (order, user) => {
  if (!order?._id) return Promise.resolve();

  const eventId = order.purchaseEventId || `purchase_${order._id}`;

  const contents = (order.items || [])
    .map((it) => {
      const id = String(it.product?._id || it.product || "");
      const q = Number(it.quantity);
      const p = safeMoney(it.price);
      if (!id) return null;
      if (!Number.isFinite(q) || q <= 0) return null;
      if (p === null) return null;
      return { id, quantity: q, item_price: p };
    })
    .filter(Boolean);

  if (contents.length === 0) return Promise.resolve();

  const total = safeMoney(order.total);
  if (total === null) return Promise.resolve();

  const shipping = order.shippingAddress || {};

  return trackMetaEvent({
    eventName: "Purchase",
    eventId,
    customData: {
      content_ids: contents.map((c) => c.id),
      content_type: "product",
      contents,
      num_items: contents.reduce((s, c) => s + c.quantity, 0),
      value: total,
      currency: "INR",
      order_id: order.orderNumber || String(order._id),
    },
    userData: user
      ? {
          email: user.email,
          phone: user.phone || shipping.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.pincode,
          country: "IN",
          externalId: user._id?.toString(),
        }
      : {
          email: order.user?.email,
          phone: order.user?.phone || shipping.phone,
          firstName: order.user?.firstName,
          lastName: order.user?.lastName,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.pincode,
          country: "IN",
          externalId: order.user?._id?.toString(),
        },
  });
};
