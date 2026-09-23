// backend/controllers/wishlistController.js

import User from "../models/User.js";
import Product from "../models/Product.js";
import { wishlistAddedEmail } from "../utils/emailTemplates.js";
import { sendTransactionalEmail } from "../utils/emailService.js";

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isNew = !user.wishlist.some(
      (id) => id.toString() === req.params.productId.toString(),
    );

    if (isNew) {
      user.wishlist.push(req.params.productId);

      // ✅ Reset follow-up tracking on wishlist activity
      user.wishlistFollowUpStage = 0;
      user.wishlistLastActivityAt = new Date();

      await user.save();

      // ✅ Send wishlist added email (non-blocking, deduped per product)
      try {
        const product = await Product.findById(req.params.productId).select(
          "name images price comparePrice",
        );
        if (product && user.email) {
          const tpl = wishlistAddedEmail({ user, product });
          sendTransactionalEmail({
            to: user.email,
            subject: tpl.subject,
            html: tpl.html,
            type: "wishlist_added",
            userId: user._id,
            refId: product._id,
            refType: "product",
          }).catch(() => {});
        }
      } catch (emailErr) {
        console.log("Wishlist email failed:", emailErr.message);
      }
    }

    const populatedUser = await User.findById(req.user._id).populate(
      "wishlist",
    );
    res.status(200).json({ success: true, wishlist: populatedUser.wishlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== req.params.productId,
    );
    user.wishlistLastActivityAt = new Date();
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate(
      "wishlist",
    );
    res.status(200).json({ success: true, wishlist: populatedUser.wishlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = [];
    user.wishlistLastActivityAt = new Date();
    user.wishlistFollowUpStage = 0;
    await user.save();
    res.status(200).json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
