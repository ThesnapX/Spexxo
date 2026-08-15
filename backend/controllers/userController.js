import User from "../models/User.js";

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

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-wishlist");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
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
    res
      .status(200)
      .json({
        success: true,
        message: "Account deactivated. Contact support to reactivate.",
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
