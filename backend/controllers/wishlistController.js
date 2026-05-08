import User from "../models/User.js";

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.wishlist.includes(req.params.productId)) {
      user.wishlist.push(req.params.productId);
      await user.save();
    }

    const populatedUser = await User.findById(req.user._id).populate(
      "wishlist",
    );
    res.status(200).json({ success: true, wishlist: populatedUser.wishlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (item) => item.toString() !== req.params.productId,
    );
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate(
      "wishlist",
    );
    res.status(200).json({ success: true, wishlist: populatedUser.wishlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = [];
    await user.save();
    res.status(200).json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
