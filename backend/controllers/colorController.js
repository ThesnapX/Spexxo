import Color from "../models/Color.js";

// @desc    Get all colors
// @route   GET /api/colors
// @access  Public
export const getColors = async (req, res) => {
  try {
    const colors = await Color.find({ isActive: true }).sort("name");
    res.status(200).json({ success: true, colors });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single color
// @route   GET /api/colors/:slug
// @access  Public
export const getColor = async (req, res) => {
  try {
    const color = await Color.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!color) {
      return res
        .status(404)
        .json({ success: false, message: "Color not found" });
    }
    res.status(200).json({ success: true, color });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create color (Admin)
// @route   POST /api/colors
// @access  Private/Admin
export const createColor = async (req, res) => {
  try {
    const color = await Color.create(req.body);
    res.status(201).json({ success: true, color });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update color (Admin)
// @route   PUT /api/colors/:id
// @access  Private/Admin
export const updateColor = async (req, res) => {
  try {
    const color = await Color.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!color) {
      return res
        .status(404)
        .json({ success: false, message: "Color not found" });
    }
    res.status(200).json({ success: true, color });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete color (Admin)
// @route   DELETE /api/colors/:id
// @access  Private/Admin
export const deleteColor = async (req, res) => {
  try {
    const color = await Color.findByIdAndDelete(req.params.id);
    if (!color) {
      return res
        .status(404)
        .json({ success: false, message: "Color not found" });
    }
    res.status(200).json({ success: true, message: "Color deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
