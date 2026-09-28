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

// Session-scoped ViewContent de-dupe.
const viewContentFiredFor = new Set();

// ─────────────────────────────────────────────
// Safe numeric normalization
// ─────────────────────────────────────────────
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
    console.log("[Meta] Captured fbclid → _fbc persisted");
  } catch (err) {
    console.warn("[Meta] fbclid capture failed:", err.message);
  }
};

export const getFbp = () => readCookie("_fbp");
export const getFbc = () => readCookie("_fbc");

// ─────────────────────────────────────────────
// ADVANCED MATCHING
// ─────────────────────────────────────────────
const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const normalizeName = (name) => {
  if (!name || typeof name !== "string") return null;
  const trimmed = name.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Attach advanced matching params to fbq. Must be called whenever
 * the current user (or guest session data) changes.
 *
 * @param {object|null} user
 */
export const setAdvancedMatching = (user) => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const params = {};

  if (user) {
    const em = normalizeEmail(user.email);
    const ph = normalizePhone(user.phone);
    const fn = normalizeName(user.firstName);
    const ln = normalizeName(user.lastName);
    const externalId = user._id || user.customerId || null;
    const city = normalizeName(user.defaultAddress?.city);
    const state = normalizeName(user.defaultAddress?.state);
    const zip = user.defaultAddress?.pincode
      ? String(user.defaultAddress.pincode).replace(/\D/g, "")
      : null;
    const country = normalizeName(user.defaultAddress?.country) || "in";

    if (em) params.em = em;
    if (ph) params.ph = ph;
    if (fn) params.fn = fn;
    if (ln) params.ln = ln;
    if (city) params.ct = city;
    if (state) params.st = state;
    if (zip) params.zp = zip;
    if (country) params.country = country;
    if (externalId) params.external_id = String(externalId);
  }

  const fbp = getFbp();
  const fbc = getFbc();
  if (fbp) params.fbp = fbp;
  if (fbc) params.fbc = fbc;

  try {
    window.fbq("init", PIXEL_ID, params);
  } catch (err) {
    console.warn("[Meta] setAdvancedMatching failed:", err.message);
  }
};

/**
 * Clear advanced matching on logout.
 */
export const clearAdvancedMatching = () => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("init", PIXEL_ID, {});
  } catch (err) {
    console.warn("[Meta] clearAdvancedMatching failed:", err.message);
  }
};

// ─────────────────────────────────────────────
// ✅ ALIAS EXPORTS
// ─────────────────────────────────────────────
// AuthContext.jsx imports functions with the "Identity" suffix.
// These aliases make the module satisfy BOTH naming conventions so
// nothing breaks regardless of which name is used anywhere in the app.

export const setAdvancedMatchingIdentity = setAdvancedMatching;
export const clearAdvancedMatchingIdentity = clearAdvancedMatching;

// ─────────────────────────────────────────────
// Core event dispatcher
// ─────────────────────────────────────────────
export const trackMetaEvent = async ({
  eventName,
  customData = {},
  userData = {},
  eventId: providedEventId,
}) => {
  const eventId = providedEventId || generateEventId();

  if ("value" in customData) {
    const v = safeMoney(customData.value);
    customData = { ...customData, value: v };
    if (v === null) delete customData.value;
  }

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
    if (customData.contents.length === 0) delete customData.contents;
  }

  let browserFired = false;
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", eventName, customData, { eventID: eventId });
      browserFired = true;
    }
  } catch (err) {
    console.warn(`[Meta] fbq failed for ${eventName}:`, err.message);
  }

  const enrichedUserData = {
    ...userData,
    fbp: userData.fbp || getFbp(),
    fbc: userData.fbc || getFbc(),
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
    console.warn(`[Meta] CAPI failed for ${eventName}:`, err.message);
  }

  if (import.meta.env.DEV) {
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
export const trackViewContent = (product, user = null) => {
  if (!product?._id) return Promise.resolve();

  const key = String(product._id);
  if (viewContentFiredFor.has(key)) {
    return Promise.resolve();
  }
  viewContentFiredFor.add(key);

  const productPrice = Number(product.price) || 0;
  const comparePrice = Number(product.comparePrice) || 0;
  const sellingPrice =
    comparePrice > 0 && comparePrice < productPrice
      ? comparePrice
      : productPrice;

  const value = safeMoney(sellingPrice);
  if (value === null) return Promise.resolve();

  const userData = user
    ? {
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        externalId: user._id?.toString(),
      }
    : {};

  return trackMetaEvent({
    eventName: "ViewContent",
    customData: {
      content_ids: [String(product._id)],
      content_type: "product",
      content_name: product.name,
      value,
      currency: "INR",
    },
    userData,
  });
};

export const trackAddToCart = (
  product,
  quantity = 1,
  variant = null,
  user = null,
) => {
  if (!product?._id) return Promise.resolve();

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return Promise.resolve();

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

  const userData = user
    ? {
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        externalId: user._id?.toString(),
      }
    : {};

  return trackMetaEvent({
    eventName: "AddToCart",
    customData: {
      content_ids: [String(product._id)],
      content_type: "product",
      contents: [
        { id: String(product._id), quantity: qty, item_price: unitPrice },
      ],
      value,
      currency: "INR",
    },
    userData,
  });
};

export const trackInitiateCheckout = ({
  items,
  value,
  numItems,
  user = null,
}) => {
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

  const userData = user
    ? {
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        externalId: user._id?.toString(),
      }
    : {};

  return trackMetaEvent({
    eventName: "InitiateCheckout",
    customData: payload,
    userData,
  });
};

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

export const trackPageView = (user = null) => {
  const userData = user
    ? {
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        externalId: user._id?.toString(),
      }
    : {};

  return trackMetaEvent({
    eventName: "PageView",
    customData: {},
    userData,
  });
};
