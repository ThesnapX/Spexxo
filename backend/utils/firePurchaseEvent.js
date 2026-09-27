// backend/utils/firePurchaseEvent.js
//
// Single source of truth for firing the Meta "Purchase" event for an order.
//
// Guarantees:
//   - Exactly one successful Purchase per order, ever.
//   - event_id is deterministic and stable across retries.
//   - A failed Meta request leaves the order in a RETRYABLE state
//     (purchaseEventStatus = "failed"); a later call can retry with the
//     SAME event_id.
//   - Never throws. Tracking MUST NOT break the payment/order flow.
//   - Uses the DB-stored order.total, never a frontend-supplied value.
//
// State machine on order:
//   null      -> not yet attempted
//   "pending" -> claimed by a request, meta call in flight
//   "sent"    -> Meta confirmed success (terminal)
//   "failed"  -> Meta rejected or network error (retryable)
//
// Concurrency:
//   The claim transition is atomic via findOneAndUpdate with a strict
//   filter. Two concurrent callers cannot both claim.

import { sendMetaEvent } from "./metaCapi.js";

/**
 * Fire (or retry) the Meta Purchase event for an order.
 *
 * @param {import("../models/Order.js").default} order  Populated Order doc.
 * @param {object|null} req                             Optional Express req.
 * @returns {Promise<{fired:boolean, reason?:string, eventId?:string, meta?:any}>}
 */
export const firePurchaseEvent = async (order, req = null) => {
  try {
    if (!order || !order._id) {
      return { fired: false, reason: "no_order" };
    }

    const OrderModel = order.constructor;
    const eventId = `purchase_${order._id.toString()}`;

    // ── Terminal state: already successfully sent. Do not re-send. ──
    if (
      order.purchaseEventStatus === "sent" &&
      order.purchaseEventId === eventId
    ) {
      return { fired: false, reason: "already_sent", eventId };
    }

    // ── Atomic claim: only ONE caller transitions null|failed → pending. ──
    // Accept claims from {null, "failed"} AND from "pending" if the last
    // attempt is stale (> 5 minutes old) — otherwise a crashed process
    // could wedge the event forever.
    const STALE_MS = 5 * 60 * 1000;
    const staleThreshold = new Date(Date.now() - STALE_MS);

    const claimed = await OrderModel.findOneAndUpdate(
      {
        _id: order._id,
        $or: [
          { purchaseEventStatus: null },
          { purchaseEventStatus: "failed" },
          {
            purchaseEventStatus: "pending",
            purchaseTrackedAt: { $lt: staleThreshold },
          },
        ],
      },
      {
        $set: {
          purchaseEventId: eventId,
          purchaseEventStatus: "pending",
          purchaseTrackedAt: new Date(),
          purchaseTrackingError: null,
        },
      },
      { new: true },
    );

    if (!claimed) {
      // Another concurrent request already holds the claim, or the event
      // has already been sent successfully.
      const fresh = await OrderModel.findById(order._id).select(
        "purchaseEventStatus purchaseEventId",
      );
      return {
        fired: false,
        reason:
          fresh?.purchaseEventStatus === "sent"
            ? "already_sent"
            : "race_already_claimed",
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
      await OrderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            purchaseEventStatus: "failed",
            purchaseTrackingError: "no_valid_contents",
          },
        },
      );
      console.warn(
        `[CAPI] Purchase skipped — no valid contents for order ${claimed.orderNumber || claimed._id}`,
      );
      return { fired: false, reason: "no_valid_contents", eventId };
    }

    const total = Number(claimed.total);
    if (!Number.isFinite(total) || total < 0) {
      await OrderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            purchaseEventStatus: "failed",
            purchaseTrackingError: "invalid_total",
          },
        },
      );
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

    // ── Send to Meta. Result decides terminal state. ──
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

    if (result?.success) {
      await OrderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            purchaseEventStatus: "sent",
            purchaseTrackedAt: new Date(),
            purchaseTrackingError: null,
          },
        },
      );
      return { fired: true, eventId, meta: result };
    }

    // ── Meta rejected or errored → mark retryable. ──
    await OrderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          purchaseEventStatus: "failed",
          purchaseTrackedAt: new Date(),
          purchaseTrackingError:
            result?.reason || result?.error?.message || "meta_rejected",
        },
      },
    );
    console.warn(
      `[CAPI] Purchase not confirmed | order=${claimed.orderNumber || claimed._id} | reason=${result?.reason || "unknown"}`,
    );
    return {
      fired: false,
      reason: result?.reason || "meta_rejected",
      eventId,
      meta: result,
    };
  } catch (err) {
    // ABSOLUTELY MUST NOT bubble up. Tracking is secondary.
    console.error("[CAPI] Purchase fire error (non-fatal):", err.message);
    // Best-effort: leave the state retryable. If the failure happened
    // before the claim write, the doc is still in its previous state.
    try {
      const OrderModel = order?.constructor;
      if (OrderModel && order?._id) {
        await OrderModel.updateOne(
          { _id: order._id, purchaseEventStatus: { $ne: "sent" } },
          {
            $set: {
              purchaseEventStatus: "failed",
              purchaseTrackingError: err.message?.slice(0, 200) || "exception",
            },
          },
        );
      }
    } catch {}
    return { fired: false, reason: "exception", error: err.message };
  }
};

export default firePurchaseEvent;
