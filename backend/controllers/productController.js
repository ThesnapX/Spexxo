import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort,
      search,
      category,
      brand,
      gender,
      productType,
      frameShape,
      lensType,
      minPrice,
      maxPrice,
      rating,
      isFeatured,
      isTrending,
      isNewArrival,
      isBestSeller,
      includeInactive,
      hideOutOfStock = "true", // ✅ NEW: Hide out of stock by default
    } = req.query;

    const query = {};

    // If includeInactive is not true, only show active products
    if (includeInactive !== "true") {
      query.isActive = true;
    }

    // ✅ NEW: Hide out of stock products by default
    if (hideOutOfStock !== "false") {
      query.stock = { $gt: 0 };
    }

    // Search - must use $and to combine with other filters
    if (search) {
      const searchTerms = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { frameShape: { $regex: search, $options: "i" } },
        { frameMaterial: { $regex: search, $options: "i" } },
        { frameColor: { $regex: search, $options: "i" } },
        { lensType: { $regex: search, $options: "i" } },
        { gender: { $regex: search, $options: "i" } },
        { productType: { $regex: search, $options: "i" } },
      ];
      query.$and = [{ $or: searchTerms }];
    }

    // ... rest of the filter logic (same as before) ...

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand", "name slug logo")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(), // ✅ Added lean() for better performance
      Product.countDocuments(query),
    ]);

    // ... rest of the code (same as before) ...

    res.status(200).json({
      success: true,
      products: productsWithCategories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    let product = await Product.findOne({ slug, isActive: true }).populate(
      "brand",
      "name slug logo",
    );
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).populate(
        "brand",
        "name slug logo",
      );
    }
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const productObj = product.toObject();
    if (productObj.category) {
      const categoryIds = productObj.category.split(",").filter(Boolean);
      const categories = await Category.find({ _id: { $in: categoryIds } });
      productObj.categories = categories;
      productObj.category = categories[0] || null;
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { productType: product.productType },
        ...(productObj.category
          ? [{ category: { $regex: productObj.category._id.toString() } }]
          : []),
      ],
    })
      .limit(6)
      .populate("brand", "name slug");

    res
      .status(200)
      .json({ success: true, product: productObj, relatedProducts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Return the updated product with a flag that it was updated
    res.status(200).json({
      success: true,
      product,
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product active status
// @route   PUT /api/products/:id/toggle
// @access  Private/Admin
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product.isActive = !product.isActive;
    await product.save();
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
