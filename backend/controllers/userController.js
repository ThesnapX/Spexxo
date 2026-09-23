// backend/controllers/userController.js

import User from "../models/User.js";
import Cart from "../models/Cart.js";

// ─────────────────────────────────────────────
// Helper: days passed since a date
// ─────────────────────────────────────────────
const daysPassed = (date) => {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-wishlist").sort("-createdAt");
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all users WITH cart + wishlist summaries (Admin)
// @route   GET /api/users/cart-wishlist
// @access  Private/Admin
//
// Query params:
//   type = "cart" | "wishlist"   (default: "cart")
//   sort = "days-desc" | "days-asc" | "count-desc" | "count-asc" | "name-asc" | "name-desc"
//   search = string (matches firstName, lastName, email, username, customerId, phone)
export const getUsersWithCartWishlist = async (req, res) => {
  try {
    const { type = "cart", sort = "days-desc", search = "" } = req.query;

    // Build the user search filter
    const userQuery = {};
    if (search && search.trim()) {
      const re = new RegExp(search.trim(), "i");
      userQuery.$or = [
        { firstName: re },
        { lastName: re },
        { email: re },
        { username: re },
        { customerId: re },
        { phone: re },
      ];
    }

    // Fetch users (with wishlist populated) — we also fetch their carts separately
    const users = await User.find(userQuery)
      .populate({
        path: "wishlist",
        select: "name slug price comparePrice images isActive",
      })
      .lean();

    const userIds = users.map((u) => u._id);

    // Fetch all carts for these users in one go
    const carts = await Cart.find({ user: { $in: userIds } })
      .populate({
        path: "items.product",
        select: "name slug price comparePrice images isActive stock",
      })
      .lean();

    const cartMap = {};
    carts.forEach((c) => {
      cartMap[c.user.toString()] = c;
    });

    // Build the result rows
    const rows = users.map((u) => {
      const cart = cartMap[u._id.toString()];

      // ---- CART data ----
      const cartItems = (cart?.items || []).filter(
        (it) => it.product && it.product._id,
      );
      const cartCount = cartItems.reduce(
        (sum, it) => sum + (it.quantity || 0),
        0,
      );
      const cartUpdatedAt = cart?.updatedAt || cart?.createdAt || null;
      const cartLastAddedAt = cartItems.length
        ? cartItems.reduce((latest, it) => {
            // Cart subdocuments don't have their own createdAt;
            // fall back to cart's updatedAt for "added at".
            const t = cart.updatedAt || cart.createdAt;
            return !latest || new Date(t) > new Date(latest) ? t : latest;
          }, null)
        : null;

      // ---- WISHLIST data ----
      // Mongoose `wishlist` is an array of Product docs; there is no per-entry
      // `addedAt` on the current schema. We fall back to user.updatedAt.
      const wishlistItems = (u.wishlist || []).filter((p) => p && p._id);
      const wishlistCount = wishlistItems.length;
      const wishlistLastAddedAt = wishlistCount
        ? u.updatedAt || u.createdAt
        : null;

      const isCartTab = type === "cart";

      const lastAddedAt = isCartTab ? cartLastAddedAt : wishlistLastAddedAt;
      const count = isCartTab ? cartCount : wishlistCount;

      return {
        _id: u._id,
        customerId: u.customerId || "",
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        username: u.username || "",
        email: u.email || "",
        phone: u.phone || "",
        isActive: u.isActive !== false,
        count,
        lastAddedAt,
        daysPassed: daysPassed(lastAddedAt),
      };
    });

    // ---- SORTING ----
    const sorted = [...rows].sort((a, b) => {
      switch (sort) {
        case "days-asc": {
          // nulls (never added) go last
          if (a.daysPassed == null && b.daysPassed == null) return 0;
          if (a.daysPassed == null) return 1;
          if (b.daysPassed == null) return -1;
          return a.daysPassed - b.daysPassed;
        }
        case "days-desc": {
          if (a.daysPassed == null && b.daysPassed == null) return 0;
          if (a.daysPassed == null) return 1;
          if (b.daysPassed == null) return -1;
          return b.daysPassed - a.daysPassed;
        }
        case "count-asc":
          return a.count - b.count;
        case "count-desc":
          return b.count - a.count;
        case "name-asc":
          return `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          );
        case "name-desc":
          return `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`,
          );
        default:
          return b.count - a.count;
      }
    });

    res.status(200).json({ success: true, users: sorted });
  } catch (error) {
    console.error("getUsersWithCartWishlist error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single user (Admin) - with cart + wishlist populated
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: "wishlist",
        select:
          "name slug price comparePrice images isActive stock productType",
      })
      .select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Fetch this user's cart
    const cart = await Cart.findOne({ user: user._id })
      .populate({
        path: "items.product",
        select:
          "name slug price comparePrice images isActive stock productType variants",
      })
      .lean();

    res.status(200).json({
      success: true,
      user,
      cart: cart || { items: [] },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-wishlist");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    // Clean up their cart too
    await Cart.findOneAndDelete({ user: req.params.id });
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Add address
// @route   POST /api/users/address
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      name: req.body.name || "Home",
      fullName: req.body.fullName || "",
      phone: req.body.phone || "",
      addressLine1: req.body.addressLine1 || "",
      addressLine2: req.body.addressLine2 || "",
      landmark: req.body.landmark || "",
      area: req.body.area || "",
      city: req.body.city || "",
      state: req.body.state || "",
      pincode: req.body.pincode || "",
      isDefault: req.body.isDefault || false,
    });

    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/users/address/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    if (req.body.fullName !== undefined) address.fullName = req.body.fullName;
    if (req.body.phone !== undefined) address.phone = req.body.phone;
    if (req.body.addressLine1 !== undefined)
      address.addressLine1 = req.body.addressLine1;
    if (req.body.addressLine2 !== undefined)
      address.addressLine2 = req.body.addressLine2;
    if (req.body.landmark !== undefined) address.landmark = req.body.landmark;
    if (req.body.area !== undefined) address.area = req.body.area;
    if (req.body.city !== undefined) address.city = req.body.city;
    if (req.body.state !== undefined) address.state = req.body.state;
    if (req.body.pincode !== undefined) address.pincode = req.body.pincode;
    if (req.body.isDefault !== undefined)
      address.isDefault = req.body.isDefault;

    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId,
    );
    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate user (Admin)
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot deactivate admin users" });
    }
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = "admin";
    user.deactivationReason = req.body.reason || "Deactivated by admin";
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reactivate user (Admin)
// @route   PUT /api/users/:id/reactivate
// @access  Private/Admin
export const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.isActive = true;
    user.deactivatedAt = undefined;
    user.deactivatedBy = undefined;
    user.deactivationReason = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User reactivated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate own account (User self-service)
// @route   PUT /api/auth/deactivate-account
// @access  Private
export const deactivateOwnAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = "user";
    user.deactivationReason = "Self-deactivated by user";
    await user.save();
    res.status(200).json({
      success: true,
      message: "Account deactivated. Contact support to reactivate.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
