// backend/utils/firePurchaseEvent.js
//
// Single source of truth for firing the Meta "Purchase" event for an order.
//
// Guarantees:
//   - Exactly one Purchase per order, ever.
//   - event_id is stable and persisted on the order (order.purchaseEventId).
//   - A retry / refresh / duplicate verify call reuses the SAME event_id,
//     so Meta's dedup window collapses them into one conversion.
//   - Never throws. Tracking MUST NOT break the payment/order flow.
//   - Uses the DB-stored order.total, never a frontend-supplied value.
//
// Callers:
//   - paymentController.confirmOrderAndReduceStock (Razorpay + COD advance)
//   - orderController.createOrder (zero-value + COD-no-advance instant confirm)
//
// Any new flow that confirms an order MUST call this and nothing else.

import { sendMetaEvent } from "./metaCapi.js";

/**
 * @param {import("../models/Order.js").default} order  A populated Order doc.
 * @param {object} req                                  Optional Express req.
 * @returns {Promise<{fired:boolean, reason?:string, eventId?:string}>}
 */
export const firePurchaseEvent = async (order, req = null) => {
  try {
    if (!order || !order._id) {
      return { fired: false, reason: "no_order" };
    }

    // ── Idempotency: any confirmed order already has an event_id. ──
    // Persisting the ID is what makes browser + CAPI + retries collapse
    // into a single conversion. If it exists, we do NOT re-emit — we
    // return the same ID so the caller can log it if it wants.
    if (order.purchaseEventId) {
      return {
        fired: false,
        reason: "already_tracked",
        eventId: order.purchaseEventId,
      };
    }

    // ── Derive event_id from the order itself. Deterministic. ──
    // Do NOT use Date.now() here: the same order MUST produce the same
    // event_id across retries. Order _id is a Mongo ObjectId — unique.
    const eventId = `purchase_${order._id.toString()}`;

    // ── Persist FIRST so a concurrent request sees it. ──
    // findByIdAndUpdate with a filter ensures only one writer wins.
    const claimed = await order.constructor.findOneAndUpdate(
      { _id: order._id, purchaseEventId: null },
      { $set: { purchaseEventId: eventId, purchaseTrackedAt: new Date() } },
      { new: true },
    );

    if (!claimed) {
      // Another concurrent call already claimed it. Do not double-fire.
      const fresh = await order.constructor
        .findById(order._id)
        .select("purchaseEventId");
      return {
        fired: false,
        reason: "race_already_claimed",
        eventId: fresh?.purchaseEventId || eventId,
      };
    }

    // ── Build payload strictly from the stored order ──
    const items = Array.isArray(claimed.items) ? claimed.items : [];

    const contents = items
      .map((it) => {
        const pid = it.product?._id || it.product;
        const qty = Number(it.quantity);
        const price = Number(it.price);
        if (!pid) return null;
        if (!Number.isFinite(qty) || qty <= 0) return null;
        if (!Number.isFinite(price) || price < 0) return null;
        return {
          id: String(pid),
          quantity: qty,
          item_price: price,
        };
      })
      .filter(Boolean);

    if (contents.length === 0) {
      // Nothing valid to send. Do NOT send NaN / undefined to Meta.
      console.warn(
        `[CAPI] Purchase skipped — no valid contents for order ${claimed.orderNumber || claimed._id}`,
      );
      return { fired: false, reason: "no_valid_contents", eventId };
    }

    const total = Number(claimed.total);
    if (!Number.isFinite(total) || total < 0) {
      console.warn(
        `[CAPI] Purchase skipped — invalid total for order ${claimed.orderNumber || claimed._id}`,
      );
      return { fired: false, reason: "invalid_total", eventId };
    }

    const numItems = contents.reduce((s, c) => s + c.quantity, 0);

    const user =
      claimed.user && typeof claimed.user === "object" && claimed.user.email
        ? claimed.user
        : null;

    const shipping = claimed.shippingAddress || {};

    const userData = {
      email: user?.email || null,
      phone: user?.phone || shipping.phone || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null,
      city: shipping.city || null,
      state: shipping.state || null,
      zip: shipping.pincode || null,
      country: "IN",
      externalId: user?._id?.toString() || null,

      // Attribution — from request if available, else null.
      fbc: req?.cookies?._fbc || req?.body?.fbc || null,
      fbp: req?.cookies?._fbp || req?.body?.fbp || null,
      clientIpAddress:
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.socket?.remoteAddress ||
        null,
      clientUserAgent: req?.headers?.["user-agent"] || null,
    };

    const customData = {
      value: total,
      currency: "INR",
      content_ids: contents.map((c) => c.id),
      content_type: "product",
      contents,
      num_items: numItems,
      order_id: claimed.orderNumber || String(claimed._id),
    };

    // ── Fire once. If this throws, metaCapi swallows it. ──
    console.log(
      `[CAPI] Firing Purchase | order=${claimed.orderNumber || claimed._id} | eventId=${eventId} | value=${total}`,
    );

    const result = await sendMetaEvent({
      eventName: "Purchase",
      eventId,
      userData,
      customData,
      eventSourceUrl: process.env.FRONTEND_URL
        ? `${String(process.env.FRONTEND_URL).replace(/\/+$/, "")}/account/orders/${claimed._id}`
        : undefined,
    });

    return {
      fired: true,
      eventId,
      meta: result,
    };
  } catch (err) {
    // ABSOLUTELY MUST NOT bubble up. Tracking is secondary.
    console.error("[CAPI] Purchase fire error (non-fatal):", err.message);
    return { fired: false, reason: "exception", error: err.message };
  }
};

export default firePurchaseEvent;
