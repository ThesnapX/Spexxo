import FrameMaterial from "../models/FrameMaterial.js";

// @desc    Get all frame materials
// @route   GET /api/frame-materials
// @access  Public
export const getFrameMaterials = async (req, res) => {
  try {
    const frameMaterials = await FrameMaterial.find({ isActive: true }).sort(
      "name",
    );
    res.status(200).json({ success: true, frameMaterials });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single frame material
// @route   GET /api/frame-materials/:slug
// @access  Public
export const getFrameMaterial = async (req, res) => {
  try {
    const frameMaterial = await FrameMaterial.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!frameMaterial) {
      return res
        .status(404)
        .json({ success: false, message: "Frame material not found" });
    }
    res.status(200).json({ success: true, frameMaterial });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create frame material (Admin)
// @route   POST /api/frame-materials
// @access  Private/Admin
export const createFrameMaterial = async (req, res) => {
  try {
    const frameMaterial = await FrameMaterial.create(req.body);
    res.status(201).json({ success: true, frameMaterial });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update frame material (Admin)
// @route   PUT /api/frame-materials/:id
// @access  Private/Admin
export const updateFrameMaterial = async (req, res) => {
  try {
    const frameMaterial = await FrameMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!frameMaterial) {
      return res
        .status(404)
        .json({ success: false, message: "Frame material not found" });
    }
    res.status(200).json({ success: true, frameMaterial });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete frame material (Admin)
// @route   DELETE /api/frame-materials/:id
// @access  Private/Admin
export const deleteFrameMaterial = async (req, res) => {
  try {
    const frameMaterial = await FrameMaterial.findByIdAndDelete(req.params.id);
    if (!frameMaterial) {
      return res
        .status(404)
        .json({ success: false, message: "Frame material not found" });
    }
    res.status(200).json({ success: true, message: "Frame material deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
