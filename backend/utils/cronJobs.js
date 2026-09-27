// backend/utils/cronJobs.js

/**
 * Daily at 10:00 AM server time — process abandoned carts & wishlists.
 * Change to "* * * * *" for every-minute during dev testing.
 */
import cron from "node-cron";
import { runAllFollowUps } from "../services/abandonedFollowUpService.js";
import Order from "../models/Order.js";
import { firePurchaseEvent } from "./firePurchaseEvent.js";

// Retry Purchase events that previously failed. Runs every 30 minutes.
// Uses the SAME event_id as the first attempt so Meta dedupes.
const retryFailedPurchases = async () => {
  try {
    const candidates = await Order.find({
      purchaseEventStatus: "failed",
      orderStatus: { $in: ["confirmed", "processing", "shipped", "delivered"] },
      paymentStatus: "paid",
    })
      .limit(25)
      .populate("user", "email phone firstName lastName _id")
      .populate("items.product", "name slug images sku");

    if (candidates.length === 0) return;

    console.log(
      `[CRON] Retrying ${candidates.length} failed Purchase events...`,
    );

    for (const order of candidates) {
      await firePurchaseEvent(order, null).catch(() => {});
    }
  } catch (err) {
    console.error("[CRON] Purchase retry failed:", err.message);
  }
};

export const startCronJobs = () => {
  // Daily follow-ups at 10 AM
  cron.schedule("0 10 * * *", () => {
    console.log("[CRON] Running daily abandoned follow-ups...");
    runAllFollowUps();
  });

  // Purchase retries every 30 minutes
  cron.schedule("*/30 * * * *", () => {
    retryFailedPurchases();
  });

  console.log("✅ Cron jobs scheduled");
};
