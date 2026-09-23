// backend/controllers/contactController.js

import Contact from "../models/Contact.js";

// @desc    Submit contact form (public)
// @route   POST /api/contact
// @access  Public
export const submitContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      contact,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all contacts (Admin)
// @route   GET /api/contact
// @access  Private/Admin
export const getContacts = async (req, res) => {
  try {
    const { search = "", status = "", sort = "newest" } = req.query;

    const query = {};
    if (status === "unread") query.isRead = false;
    if (status === "read") query.isRead = true;
    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [
        { name: re },
        { email: re },
        { subject: re },
        { message: re },
        { phone: re },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "name-asc") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };

    const contacts = await Contact.find(query).sort(sortOption).lean();

    res.json({ success: true, contacts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get unread count (Admin) — for sidebar badge
// @route   GET /api/contact/unread-count
// @access  Private/Admin
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Contact.countDocuments({ isRead: false });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Mark a contact form as read/unread (Admin)
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
export const markContactRead = async (req, res) => {
  try {
    const { isRead } = req.body;
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    contact.isRead = !!isRead;
    if (isRead) {
      contact.readAt = new Date();
      contact.readBy = req.user?._id || null;
    } else {
      contact.readAt = null;
      contact.readBy = null;
    }
    await contact.save();

    res.json({ success: true, contact });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact form (Admin)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }
    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
