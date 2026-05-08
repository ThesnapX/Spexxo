import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const { productType, gender } = req.query;
    const query = { isActive: true };

    if (productType) {
      query.$or = [
        { productType: productType },
        { productType: { $regex: productType, $options: "i" } },
      ];
    }

    if (gender) {
      // Add gender filter alongside productType filter
      const genderFilter = {
        $or: [
          { gender: gender },
          { gender: { $regex: gender, $options: "i" } },
        ],
      };

      if (query.$or) {
        // Combine with existing $or
        query.$and = [{ $or: query.$or }, genderFilter];
        delete query.$or;
      } else {
        query.$or = genderFilter.$or;
      }
    }

    const categories = await Category.find(query).sort("sortOrder");
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
