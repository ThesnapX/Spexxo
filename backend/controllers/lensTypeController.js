import LensType from "../models/LensType.js";

// @desc    Get all lens types
// @route   GET /api/lens-types
// @access  Public
export const getLensTypes = async (req, res) => {
  try {
    const lensTypes = await LensType.find({ isActive: true }).sort("name");
    res.status(200).json({ success: true, lensTypes });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single lens type
// @route   GET /api/lens-types/:slug
// @access  Public
export const getLensType = async (req, res) => {
  try {
    const lensType = await LensType.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!lensType) {
      return res
        .status(404)
        .json({ success: false, message: "Lens type not found" });
    }
    res.status(200).json({ success: true, lensType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create lens type (Admin)
// @route   POST /api/lens-types
// @access  Private/Admin
export const createLensType = async (req, res) => {
  try {
    const lensType = await LensType.create(req.body);
    res.status(201).json({ success: true, lensType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update lens type (Admin)
// @route   PUT /api/lens-types/:id
// @access  Private/Admin
export const updateLensType = async (req, res) => {
  try {
    const lensType = await LensType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!lensType) {
      return res
        .status(404)
        .json({ success: false, message: "Lens type not found" });
    }
    res.status(200).json({ success: true, lensType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete lens type (Admin)
// @route   DELETE /api/lens-types/:id
// @access  Private/Admin
export const deleteLensType = async (req, res) => {
  try {
    const lensType = await LensType.findByIdAndDelete(req.params.id);
    if (!lensType) {
      return res
        .status(404)
        .json({ success: false, message: "Lens type not found" });
    }
    res.status(200).json({ success: true, message: "Lens type deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
