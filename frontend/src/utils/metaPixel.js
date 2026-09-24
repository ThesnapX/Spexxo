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
// Attribution capture (fbclid → _fbc) + cookie helpers
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
 * Called once at app boot. Safe to call repeatedly.
 */
export const captureFbclid = () => {
  try {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get("fbclid");
    if (!fbclid) return;

    // Only write if no valid _fbc exists already
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
// Core event dispatcher — Browser + CAPI dual-fire
// ─────────────────────────────────────────────
export const trackMetaEvent = async ({
  eventName,
  customData = {},
  userData = {},
  eventId: providedEventId,
}) => {
  const eventId = providedEventId || generateEventId();

  // 1) Browser pixel
  let browserFired = false;
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", eventName, customData, { eventID: eventId });
      browserFired = true;
    }
  } catch (err) {
    console.warn(`[Meta] fbq failed for ${eventName}:`, err.message);
  }

  // 2) Server CAPI — attach attribution
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
    console.warn(`[Meta] CAPI failed for ${eventName}:`, err.message);
  }

  // Dev diagnostics
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
export const trackViewContent = (product) => {
  if (!product?._id) return Promise.resolve();
  const price = Number(product.comparePrice || product.price || 0);
  return trackMetaEvent({
    eventName: "ViewContent",
    customData: {
      content_ids: [product._id],
      content_type: "product",
      content_name: product.name,
      value: price,
      currency: "INR",
    },
  });
};

export const trackAddToCart = (product, quantity = 1, variant = null) => {
  if (!product?._id) return Promise.resolve();

  // Use variant price when available — matches what the user actually pays
  const unitPrice = Number(
    variant?.price ?? product.comparePrice ?? product.price ?? 0,
  );
  const value = unitPrice * quantity;

  return trackMetaEvent({
    eventName: "AddToCart",
    customData: {
      content_ids: [product._id],
      content_type: "product",
      contents: [
        {
          id: product._id,
          quantity,
          item_price: unitPrice,
        },
      ],
      value,
      currency: "INR",
    },
  });
};

export const trackInitiateCheckout = ({ items, value, numItems }) => {
  const contents = items.map((it) => ({
    id: it.productId || it.product?._id || it.id,
    quantity: it.quantity || 1,
    item_price: Number(it.price || it.item_price || 0),
  }));

  return trackMetaEvent({
    eventName: "InitiateCheckout",
    customData: {
      content_ids: contents.map((c) => c.id).filter(Boolean),
      content_type: "product",
      contents,
      num_items: numItems ?? contents.reduce((s, c) => s + c.quantity, 0),
      value: Number(value || 0),
      currency: "INR",
    },
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

  const contents = (order.items || []).map((it) => ({
    id: String(it.product?._id || it.product),
    quantity: Number(it.quantity || 1),
    item_price: Number(it.price || 0),
  }));

  return trackMetaEvent({
    eventName: "Purchase",
    eventId,
    customData: {
      content_ids: contents.map((c) => c.id),
      content_type: "product",
      contents,
      num_items: contents.reduce((s, c) => s + c.quantity, 0),
      value: Number(order.total || 0),
      currency: "INR",
      order_id: order.orderNumber || String(order._id),
    },
    userData: user
      ? {
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      : {},
  });
};
