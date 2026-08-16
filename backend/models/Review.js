import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
    },
    images: [
      {
        url: String,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    adminReply: {
      type: String,
      default: null,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate reviews
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
