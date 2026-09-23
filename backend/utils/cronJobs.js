// backend/utils/cronJobs.js

import cron from "node-cron";
import { runAllFollowUps } from "../services/abandonedFollowUpService.js";

/**
 * Daily at 10:00 AM server time — process abandoned carts & wishlists.
 * Change to "* * * * *" for every-minute during dev testing.
 */
export const startCronJobs = () => {
  // ✅ Daily follow-ups at 10 AM
  cron.schedule("0 10 * * *", () => {
    console.log("[CRON] Running daily abandoned follow-ups...");
    runAllFollowUps();
  });

  console.log("✅ Cron jobs scheduled");
};
