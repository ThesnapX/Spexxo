import Review from "../models/Review.js";
import Product from "../models/Product.js";

// @desc    Get product reviews (Public)
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true,
    })
      .populate("user", "firstName lastName avatar")
      .sort("-createdAt");

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/all
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
  try {
    const { product, rating, isHidden, limit = 50 } = req.query;
    const query = {};

    if (product) {
      query.product = product;
    }

    if (rating) {
      query.rating = { $gte: parseInt(rating) };
    }

    if (isHidden === "true") {
      query.isHidden = true;
    } else if (isHidden === "false") {
      query.isHidden = { $ne: true };
    }

    const reviews = await Review.find(query)
      .populate("user", "firstName lastName email avatar")
      .populate("product", "name slug images price")
      .sort("-createdAt")
      .limit(parseInt(limit));

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create review
// @route   POST /api/reviews/:productId
// @access  Private
export const createReview = async (req, res) => {
  try {
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: req.params.productId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ success: false, message: "You already reviewed this product" });
    }

    const review = await Review.create({
      user: req.user._id,
      product: req.params.productId,
      ...req.body,
    });

    // Update product rating
    const stats = await Review.aggregate([
      {
        $match: {
          product: review.product,
          isApproved: true,
          isHidden: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(req.params.productId, {
        "ratings.average": Math.round(stats[0].avgRating * 10) / 10,
        "ratings.count": stats[0].count,
      });
    }

    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "firstName lastName avatar",
    );

    res.status(201).json({ success: true, review: populatedReview });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });

    // Recalculate product rating
    const stats = await Review.aggregate([
      {
        $match: {
          product: review.product,
          isApproved: true,
          isHidden: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(review.product, {
        "ratings.average": Math.round(stats[0].avgRating * 10) / 10,
        "ratings.count": stats[0].count,
      });
    }

    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });

    const stats = await Review.aggregate([
      {
        $match: {
          product: review.product,
          isApproved: true,
          isHidden: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(review.product, {
      "ratings.average":
        stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      "ratings.count": stats.length > 0 ? stats[0].count : 0,
    });

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle review visibility (Admin)
// @route   PUT /api/reviews/:id/toggle
// @access  Private/Admin
export const toggleReviewVisibility = async (req, res) => {
  try {
    const { isHidden } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isHidden },
      { new: true },
    );

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Recalculate product rating
    const stats = await Review.aggregate([
      {
        $match: {
          product: review.product,
          isApproved: true,
          isHidden: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(review.product, {
      "ratings.average":
        stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      "ratings.count": stats.length > 0 ? stats[0].count : 0,
    });

    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reply to review (Admin)
// @route   PUT /api/reviews/:id/reply
// @access  Private/Admin
export const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { adminReply: reply },
      { new: true },
    );

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res.status(200).json({ success: true, review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
