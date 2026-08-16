import Shape from "../models/Shape.js";

// @desc    Get all shapes
// @route   GET /api/shapes
// @access  Public
export const getShapes = async (req, res) => {
  try {
    const shapes = await Shape.find({ isActive: true }).sort("name");
    res.status(200).json({ success: true, shapes });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single shape
// @route   GET /api/shapes/:slug
// @access  Public
export const getShape = async (req, res) => {
  try {
    const shape = await Shape.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!shape) {
      return res
        .status(404)
        .json({ success: false, message: "Shape not found" });
    }
    res.status(200).json({ success: true, shape });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create shape (Admin)
// @route   POST /api/shapes
// @access  Private/Admin
export const createShape = async (req, res) => {
  try {
    const shape = await Shape.create(req.body);
    res.status(201).json({ success: true, shape });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update shape (Admin)
// @route   PUT /api/shapes/:id
// @access  Private/Admin
export const updateShape = async (req, res) => {
  try {
    const shape = await Shape.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!shape) {
      return res
        .status(404)
        .json({ success: false, message: "Shape not found" });
    }
    res.status(200).json({ success: true, shape });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete shape (Admin)
// @route   DELETE /api/shapes/:id
// @access  Private/Admin
export const deleteShape = async (req, res) => {
  try {
    const shape = await Shape.findByIdAndDelete(req.params.id);
    if (!shape) {
      return res
        .status(404)
        .json({ success: false, message: "Shape not found" });
    }
    res.status(200).json({ success: true, message: "Shape deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
