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
      frameColor,
      lensType,
      minPrice,
      maxPrice,
      rating,
      isFeatured,
      isTrending,
      isNewArrival,
      isBestSeller,
    } = req.query;

    const query = { isActive: true };

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter - match by slug
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        query.category = cat._id;
      }
    }

    // Brand filter - match by slug (for multiple)
    if (brand) {
      const brandSlugs = brand.split(",");
      const brands = await Brand.find({ slug: { $in: brandSlugs } });
      if (brands.length > 0) {
        query.brand = { $in: brands.map((b) => b._id) };
      }
    }

    // Gender filter
    if (gender) {
      const genders = gender.split(",");
      query.gender = { $in: genders };
    }

    // Product type
    if (productType) {
      query.productType = productType;
    }

    // Frame shape
    if (frameShape) {
      const shapes = frameShape.split(",");
      query.frameShape = { $in: shapes };
    }

    // Lens type
    if (lensType) {
      const types = lensType.split(",");
      query.lensType = { $in: types };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating
    if (rating) {
      query["ratings.average"] = { $gte: Number(rating) };
    }

    // Flags
    if (isFeatured) query.isFeatured = true;
    if (isTrending) query.isTrending = true;
    if (isNewArrival) query.isNewArrival = true;
    if (isBestSeller) query.isBestSeller = true;

    // Sort
    let sortOption = {};
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { "ratings.average": -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "popular":
        sortOption = { "ratings.count": -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    console.log("Query:", JSON.stringify(query));
    console.log("Sort:", sortOption);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("brand", "name slug logo")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("brand", "name slug logo");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
    })
      .limit(6)
      .populate("category", "name slug");

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
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
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
