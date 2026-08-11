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

    // Category filter - handle comma-separated string
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        // Match if category field contains this ID (works for both single and comma-separated)
        query.category = { $regex: cat._id.toString() };
      }
    }

    // Brand filter
    if (brand) {
      const brandSlugs = brand.split(",");
      const brands = await Brand.find({ slug: { $in: brandSlugs } });
      if (brands.length > 0) {
        const brandIds = brands.map((b) => b._id.toString());
        if (brandSlugs.length === 1) {
          query.brand = { $regex: brandIds[0] };
        } else {
          query.$or = brandIds.map((id) => ({ brand: { $regex: id } }));
        }
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
      const shapeConditions = shapes.map((shape) => ({
        frameShape: { $regex: shape, $options: "i" },
      }));
      if (shapeConditions.length === 1) {
        query.frameShape = shapeConditions[0].frameShape;
      } else {
        query.$and = query.$and || [];
        query.$and.push({ $or: shapeConditions });
      }
    }

    // Lens type
    if (lensType) {
      const types = lensType.split(",");
      const lensConditions = types.map((type) => ({
        lensType: { $regex: type, $options: "i" },
      }));
      if (lensConditions.length === 1) {
        query.lensType = lensConditions[0].lensType;
      } else {
        query.$and = query.$and || [];
        query.$and.push({ $or: lensConditions });
      }
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

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand", "name slug logo")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    // Get all categories for name lookup
    const allCategories = await Category.find({});
    const categoryMap = {};
    allCategories.forEach((cat) => {
      categoryMap[cat._id.toString()] = cat;
    });

    // Attach category names to products
    const productsWithCategories = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.category) {
        const categoryIds = productObj.category.split(",").filter(Boolean);
        productObj.categories = categoryIds
          .map((id) => {
            const cat = categoryMap[id];
            return cat
              ? { _id: cat._id, name: cat.name, slug: cat.slug }
              : null;
          })
          .filter(Boolean);
        // Keep first category as primary for backward compatibility
        productObj.category = productObj.categories[0] || null;
      }
      return productObj;
    });

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
    const { slug } = req.params;

    // Try to find by slug first, then by ID
    let product = await Product.findOne({ slug, isActive: true });

    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      // If slug looks like a MongoDB ID, try finding by ID
      product = await Product.findById(slug);
    }

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Get category names
    const productObj = product.toObject();
    if (productObj.category) {
      const categoryIds = productObj.category.split(",").filter(Boolean);
      const categories = await Category.find({ _id: { $in: categoryIds } });
      productObj.categories = categories;
      productObj.category = categories[0] || null;
    }

    // Get related products
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

    res.status(200).json({
      success: true,
      product: productObj,
      relatedProducts,
    });
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
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, product });
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
