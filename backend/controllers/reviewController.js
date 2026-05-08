import Review from "../models/Review.js";
import Product from "../models/Product.js";

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
      { $match: { product: review.product, isApproved: true } },
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
      { $match: { product: review.product, isApproved: true } },
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
      { $match: { product: review.product, isApproved: true } },
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
