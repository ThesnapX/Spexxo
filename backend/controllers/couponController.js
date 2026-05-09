import Coupon from "../models/Coupon.js";

export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user?._id;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired coupon code",
      });
    }

    // Check total usage limit
    if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    // Check per-user limit
    if (userId && coupon.perUserLimit) {
      const userUsage = coupon.usedBy?.find(
        (u) => u.user.toString() === userId.toString(),
      );
      if (userUsage && userUsage.count >= coupon.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already used this coupon ${coupon.perUserLimit} time(s)`,
        });
      }
    }

    // Check minimum purchase
    if (cartTotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minPurchase} required`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = Math.min(coupon.discountValue, cartTotal);
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountOn: coupon.discountOn,
        discount,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Apply coupon (mark as used)
// @route   POST /api/coupons/apply
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid coupon" });
    }

    // Increment total usage
    coupon.usedCount = (coupon.usedCount || 0) + 1;

    // Track per-user usage
    const userIndex = coupon.usedBy?.findIndex(
      (u) => u.user.toString() === userId.toString(),
    );

    if (userIndex > -1) {
      coupon.usedBy[userIndex].count += 1;
    } else {
      coupon.usedBy.push({ user: userId, count: 1 });
    }

    await coupon.save();

    res.status(200).json({ success: true, message: "Coupon applied" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort("-createdAt");
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
