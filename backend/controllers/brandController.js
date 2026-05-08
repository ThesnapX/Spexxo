import Brand from "../models/Brand.js";

export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true });
    res.status(200).json({ success: true, brands });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBrand = async (req, res) => {
  try {
    const brand = await Brand.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res.status(200).json({ success: true, brand });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, brand });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res.status(200).json({ success: true, brand });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res.status(200).json({ success: true, message: "Brand deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
