// frontend/src/utils/metaPixel.js

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1753741932563893";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─────────────────────────────────────────────
// Advanced Matching identity cache
//
// When a user is logged in, we keep their email/phone/name in a
// module-level variable and pass it to every browser + server event.
// This massively improves Event Match Quality for ViewContent,
// AddToCart, InitiateCheckout, and Purchase.
// ─────────────────────────────────────────────
let advancedMatchingIdentity = null;

/**
 * Cache the identity for Advanced Matching and re-init the pixel so
 * Meta receives hashed customer parameters on subsequent events.
 */
export const setAdvancedMatchingIdentity = (user) => {
  if (!user) return;
  const identity = {
    email: user.email || undefined,
    phone: user.phone || undefined,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    externalId: user._id ? String(user._id) : undefined,
    city: user.defaultAddress?.city || undefined,
    state: user.defaultAddress?.state || undefined,
    zip: user.defaultAddress?.pincode || undefined,
    country: "in",
  };

  // Drop undefined values so we don't send empty strings.
  Object.keys(identity).forEach((k) => {
    if (!identity[k]) delete identity[k];
  });

  if (Object.keys(identity).length === 0) return;

  advancedMatchingIdentity = identity;

  // Tell the browser pixel about the identity. Meta allows re-init
  // and uses the union of all init calls for matching.
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("init", PIXEL_ID, {
        em: identity.email,
        ph: identity.phone,
        fn: identity.firstName,
        ln: identity.lastName,
        external_id: identity.externalId,
        ct: identity.city,
        st: identity.state,
        zp: identity.zip,
        country: identity.country,
      });
    }
  } catch (err) {
    console.warn("[Meta] fbq init with Advanced Matching failed:", err.message);
  }
};

export const clearAdvancedMatchingIdentity = () => {
  advancedMatchingIdentity = null;
};

export const getAdvancedMatchingIdentity = () => advancedMatchingIdentity;

// ─────────────────────────────────────────────
// Event ID generation
// ─────────────────────────────────────────────
export const generateEventId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `evt_${ts}_${rand}`;
};

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

  // ── Merge cached Advanced Matching identity into userData. ──
  const identity = advancedMatchingIdentity || {};
  const mergedUserData = {
    ...identity,
    ...userData, // caller-supplied values win if they conflict
  };

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
    ...mergedUserData,
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
    console.warn(`[Meta] CAPI failed for ${eventName}:`, err.message);
  }

  if (import.meta.env.DEV) {
    console.log(`[Meta] ${eventName}`, {
      eventId,
      browserFired,
      matchedFields: capiResult?.meta?.matchedFields,
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

  const key = String(product._id);
  if (viewContentFiredFor.has(key)) return Promise.resolve();
  viewContentFiredFor.add(key);

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
        { id: String(product._id), quantity: qty, item_price: unitPrice },
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

  // Merge order user data with cached identity. Order user data wins.
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
          country: "in",
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
          country: "in",
          externalId: order.user?._id?.toString(),
        },
  });
};
