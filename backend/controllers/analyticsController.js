// backend/controllers/analyticsController.js

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

// @desc    Track a visitor session (idempotent per sessionId for the day)
// @route   POST /api/analytics/visit
// @access  Public
export const trackVisit = async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
      return res.status(400).json({ success: false });
    }

    // Dedupe: only one visit row per sessionId per 24h.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await ActivityLog.findOne({
      type: "visit",
      sessionId,
      createdAt: { $gte: since },
    }).lean();

    if (!existing) {
      await ActivityLog.create({
        type: "visit",
        sessionId,
        user: req.user?._id || null,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(200).json({ success: false });
  }
};

// @desc    Dashboard analytics — bounded time window
// @route   GET /api/analytics/dashboard?from=...&to=...
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : now;

    const [
      totalVisitors,
      purchasedUsers,
      wishlistTotal,
      cartTotal,
      topWishlist,
      topCart,
      topCartQty,
    ] = await Promise.all([
      // Unique sessionIds in range
      ActivityLog.distinct("sessionId", {
        type: "visit",
        sessionId: { $ne: null },
        createdAt: { $gte: from, $lte: to },
      }),

      // Distinct buyers with confirmed orders in range
      Order.distinct("user", {
        orderStatus: {
          $in: ["confirmed", "processing", "shipped", "delivered"],
        },
        createdAt: { $gte: from, $lte: to },
      }),

      // Total wishlist-add events in range
      ActivityLog.countDocuments({
        type: "wishlist_add",
        createdAt: { $gte: from, $lte: to },
      }),

      // Total cart-add events in range
      ActivityLog.countDocuments({
        type: "cart_add",
        createdAt: { $gte: from, $lte: to },
      }),

      // Most added to wishlist — product with most events
      ActivityLog.aggregate([
        {
          $match: {
            type: "wishlist_add",
            product: { $ne: null },
            createdAt: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: "$product", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            name: "$product.name",
            slug: "$product.slug",
            image: { $arrayElemAt: ["$product.images.url", 0] },
            count: 1,
          },
        },
      ]),

      // Most added to cart — by # of add actions
      ActivityLog.aggregate([
        {
          $match: {
            type: "cart_add",
            product: { $ne: null },
            createdAt: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: "$product", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            name: "$product.name",
            slug: "$product.slug",
            image: { $arrayElemAt: ["$product.images.url", 0] },
            count: 1,
          },
        },
      ]),

      // Most added to cart — by cumulative quantity (secondary metric)
      ActivityLog.aggregate([
        {
          $match: {
            type: "cart_add",
            product: { $ne: null },
            createdAt: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: "$product", quantity: { $sum: "$quantity" } } },
        { $sort: { quantity: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            name: "$product.name",
            slug: "$product.slug",
            quantity: 1,
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      range: { from, to },
      data: {
        totalVisitors: totalVisitors.length,
        purchasedUsers: purchasedUsers.length,
        wishlistAdds: wishlistTotal,
        cartAdds: cartTotal,
        mostWishlisted: topWishlist[0] || null,
        mostAddedToCart: topCart[0] || null,
        mostAddedToCartQty: topCartQty[0] || null,
        // Historical note for UI.
        historicalDataAvailable: totalVisitors.length > 0,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS] error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
