// backend/services/abandonedFollowUpService.js

import User from "../models/User.js";
import Cart from "../models/Cart.js";
import {
  abandonedCartEmail,
  abandonedWishlistEmail,
} from "../utils/emailTemplates.js";
import { sendTransactionalEmail } from "../utils/emailService.js";

// Stage thresholds in DAYS since last activity
// stage 1 => 5 days, stage 2 => 10 days, stage 3 => 15 days, stage 4 => 20 days
const STAGE_DAYS = [5, 10, 15, 20];

const daysBetween = (from, to = new Date()) => {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
};

// ─────────────────────────────────────────────
// Abandoned Cart follow-ups
// ─────────────────────────────────────────────
export const processAbandonedCarts = async () => {
  console.log("[CRON] Processing abandoned carts...");
  let sent = 0;

  const carts = await Cart.find({
    "items.0": { $exists: true },
    followUpStage: { $lt: 4 },
  })
    .populate({
      path: "user",
      select: "firstName lastName email isActive",
    })
    .populate({
      path: "items.product",
      select: "name slug images price comparePrice isActive stock",
    });

  for (const cart of carts) {
    const user = cart.user;
    if (!user || !user.email || user.isActive === false) continue;

    // Filter to valid, active products with stock
    const validItems = cart.items.filter(
      (it) =>
        it.product &&
        it.product.isActive !== false &&
        (it.product.stock || 0) > 0,
    );
    if (validItems.length === 0) continue;

    // Determine how many days passed since lastActivityAt
    const baseDate = cart.lastActivityAt || cart.updatedAt || cart.createdAt;
    const days = daysBetween(new Date(baseDate));

    // Which stage should we be at?
    let targetStage = 0;
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (days >= STAGE_DAYS[i]) {
        targetStage = i + 1;
        break;
      }
    }

    // Nothing to do if already at this stage or beyond
    if (targetStage === 0 || targetStage <= cart.followUpStage) continue;

    // Send only the current stage's email (avoids spamming multiple at once)
    const cartTotal = validItems.reduce((sum, it) => {
      const p = it.product;
      const price = p.comparePrice || p.price || 0;
      return sum + price * it.quantity;
    }, 0);

    const template = abandonedCartEmail({
      user,
      cart: { items: validItems, total: cartTotal },
      stage: targetStage,
    });

    const result = await sendTransactionalEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      type: `abandoned_cart_${targetStage}`,
      userId: user._id,
      refId: cart._id,
      refType: "cart",
    });

    if (result.success) {
      cart.followUpStage = targetStage;
      cart.lastFollowUpAt = new Date();
      await cart.save();
      sent++;
    }
  }

  console.log(`[CRON] Abandoned cart emails sent: ${sent}`);
  return sent;
};

// ─────────────────────────────────────────────
// Abandoned Wishlist follow-ups
// ─────────────────────────────────────────────
export const processAbandonedWishlists = async () => {
  console.log("[CRON] Processing abandoned wishlists...");
  let sent = 0;

  const users = await User.find({
    "wishlist.0": { $exists: true },
    wishlistFollowUpStage: { $lt: 4 },
    isActive: { $ne: false },
  }).populate({
    path: "wishlist",
    select: "name slug images price comparePrice isActive stock",
  });

  for (const user of users) {
    if (!user.email) continue;

    // Filter to valid active products with stock
    const validProducts = (user.wishlist || []).filter(
      (p) => p && p.isActive !== false && (p.stock || 0) > 0,
    );
    if (validProducts.length === 0) continue;

    const baseDate =
      user.wishlistLastActivityAt || user.updatedAt || user.createdAt;
    const days = daysBetween(new Date(baseDate));

    let targetStage = 0;
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (days >= STAGE_DAYS[i]) {
        targetStage = i + 1;
        break;
      }
    }

    if (targetStage === 0 || targetStage <= user.wishlistFollowUpStage)
      continue;

    const template = abandonedWishlistEmail({
      user,
      products: validProducts,
      stage: targetStage,
    });

    const result = await sendTransactionalEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      type: `abandoned_wishlist_${targetStage}`,
      userId: user._id,
      refId: user._id,
      refType: "wishlist",
    });

    if (result.success) {
      user.wishlistFollowUpStage = targetStage;
      user.wishlistLastFollowUpAt = new Date();
      await user.save();
      sent++;
    }
  }

  console.log(`[CRON] Abandoned wishlist emails sent: ${sent}`);
  return sent;
};

export const runAllFollowUps = async () => {
  try {
    await processAbandonedCarts();
    await processAbandonedWishlists();
  } catch (error) {
    console.error("[CRON] Follow-up job error:", error.message);
  }
};
