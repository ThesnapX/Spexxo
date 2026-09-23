// frontend/src/utils/metaPixel.js

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1753741932563893";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Generate a unique event ID (shared between browser + server)
 * Format: evt_<timestamp>_<random>
 */
export const generateEventId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `evt_${ts}_${rand}`;
};

/**
 * Track event on browser pixel AND server (CAPI)
 * Both use the same event_id for deduplication.
 *
 * @param {Object} params
 * @param {string} params.eventName - "Purchase", "AddToCart", etc.
 * @param {Object} params.customData - value, currency, content_ids, etc.
 * @param {Object} params.userData - email, phone (optional, for advanced matching)
 */
export const trackMetaEvent = async ({
  eventName,
  customData = {},
  userData = {},
}) => {
  try {
    const eventId = generateEventId();

    // 1. Fire browser pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq(
        "track",
        eventName,
        {
          value: customData.value,
          currency: customData.currency || "INR",
          content_ids: customData.content_ids,
          content_type: customData.content_type,
          contents: customData.contents,
          num_items: customData.num_items,
          order_id: customData.order_id,
        },
        { eventID: eventId },
      );
    }

    // 2. Fire server event (CAPI) — non-blocking
    fetch(`${API_URL}/meta/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        eventName,
        eventId,
        customData,
        userData,
        eventSourceUrl: window.location.href,
      }),
    }).catch((err) => console.warn("[CAPI] Server event failed:", err));

    return eventId;
  } catch (err) {
    console.error("[Meta] trackMetaEvent failed:", err);
  }
};

// ─────────────────────────────────────────────
// Convenience wrappers for common events
// ─────────────────────────────────────────────

export const trackViewContent = (product) => {
  return trackMetaEvent({
    eventName: "ViewContent",
    customData: {
      content_ids: [product._id],
      content_type: "product",
      content_name: product.name,
      value: product.comparePrice || product.price,
      currency: "INR",
    },
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  return trackMetaEvent({
    eventName: "AddToCart",
    customData: {
      content_ids: [product._id],
      content_type: "product",
      contents: [
        {
          id: product._id,
          quantity,
          item_price: product.comparePrice || product.price,
        },
      ],
      value: (product.comparePrice || product.price) * quantity,
      currency: "INR",
    },
  });
};

export const trackInitiateCheckout = (cart) => {
  const value = cart.items.reduce(
    (sum, item) =>
      sum + (item.price || item.product?.price || 0) * item.quantity,
    0,
  );
  return trackMetaEvent({
    eventName: "InitiateCheckout",
    customData: {
      content_ids: cart.items.map((i) => i.product?._id).filter(Boolean),
      content_type: "product",
      contents: cart.items.map((i) => ({
        id: i.product?._id,
        quantity: i.quantity,
        item_price: i.price || i.product?.price,
      })),
      num_items: cart.items.length,
      value,
      currency: "INR",
    },
  });
};

export const trackPurchase = (order, user) => {
  return trackMetaEvent({
    eventName: "Purchase",
    customData: {
      content_ids: (order.items || []).map((i) => i.product?._id || i.product),
      content_type: "product",
      contents: (order.items || []).map((i) => ({
        id: i.product?._id || i.product,
        quantity: i.quantity,
        item_price: i.price,
      })),
      num_items: (order.items || []).reduce((s, i) => s + i.quantity, 0),
      value: order.total,
      currency: "INR",
      order_id: order.orderNumber || order._id,
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
