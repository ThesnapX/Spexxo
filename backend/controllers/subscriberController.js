// backend/controllers/subscriberController.js

import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";

// @desc    Subscribe to newsletter (public — no login needed)
// @route   POST /api/subscribers
// @access  Public
export const subscribe = async (req, res) => {
  try {
    const { email, source = "footer" } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid email" });
    }

    const normalized = email.toLowerCase().trim();

    // Try to link to an existing user (optional)
    const user = await User.findOne({ email: normalized }).select("_id");

    // Upsert: if already subscribed, reactivate instead of erroring
    let subscriber = await Subscriber.findOne({ email: normalized });

    if (subscriber) {
      if (subscriber.isActive) {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed!",
          subscriber,
        });
      }
      subscriber.isActive = true;
      subscriber.unsubscribedAt = null;
      if (!subscriber.user && user) subscriber.user = user._id;
      await subscriber.save();
      return res.status(200).json({
        success: true,
        message: "Welcome back! Subscription reactivated.",
        subscriber,
      });
    }

    subscriber = await Subscriber.create({
      email: normalized,
      user: user ? user._id : null,
      source,
    });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully!",
      subscriber,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Unsubscribe
// @route   DELETE /api/subscribers/:email
// @access  Public
export const unsubscribe = async (req, res) => {
  try {
    const subscriber = await Subscriber.findOne({
      email: req.params.email.toLowerCase(),
    });
    if (!subscriber) {
      return res
        .status(404)
        .json({ success: false, message: "Subscriber not found" });
    }
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all subscribers (Admin)
// @route   GET /api/subscribers
// @access  Private/Admin
export const getSubscribers = async (req, res) => {
  try {
    const { search = "", status = "", sort = "newest" } = req.query;

    const query = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search.trim()) {
      query.email = { $regex: search.trim(), $options: "i" };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "email-asc") sortOption = { email: 1 };
    if (sort === "email-desc") sortOption = { email: -1 };

    const subscribers = await Subscriber.find(query)
      .populate("user", "firstName lastName customerId")
      .sort(sortOption)
      .lean();

    // Stats
    const total = subscribers.length;
    const activeCount = subscribers.filter((s) => s.isActive).length;
    const guestCount = subscribers.filter((s) => !s.user).length;
    const registeredCount = total - guestCount;

    res.json({
      success: true,
      subscribers,
      stats: { total, activeCount, guestCount, registeredCount },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete subscriber (Admin)
// @route   DELETE /api/subscribers/admin/:id
// @access  Private/Admin
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res
        .status(404)
        .json({ success: false, message: "Subscriber not found" });
    }
    res.json({ success: true, message: "Subscriber deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Export subscribers as CSV (Admin)
// @route   GET /api/subscribers/export
// @access  Private/Admin
export const exportSubscribers = async (req, res) => {
  try {
    const { status = "" } = req.query;
    const query = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const subscribers = await Subscriber.find(query)
      .populate("user", "firstName lastName customerId")
      .sort("-createdAt")
      .lean();

    const headers = [
      "Email",
      "Type",
      "Customer Name",
      "Customer ID",
      "Status",
      "Source",
      "Subscribed At",
      "Unsubscribed At",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    let csv = headers.join(",") + "\n";
    subscribers.forEach((s) => {
      const row = [
        s.email,
        s.user ? "Registered" : "Guest",
        s.user ? `${s.user.firstName} ${s.user.lastName}` : "",
        s.user?.customerId || "",
        s.isActive ? "Active" : "Inactive",
        s.source || "",
        s.subscribedAt ? new Date(s.subscribedAt).toISOString() : "",
        s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : "",
      ];
      csv += row.map(escapeCsv).join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=subscribers-${Date.now()}.csv`,
    );
    res.send(csv);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
