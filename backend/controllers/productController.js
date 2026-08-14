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
    } = req.query;

    const query = { isActive: true };

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

    // Category filter
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        const catId = cat._id.toString();
        query.$and = query.$and || [];
        query.$and.push({ category: { $regex: catId, $options: "i" } });
      } else {
        query._id = { $in: [] }; // Force empty result
      }
    }

    // Brand filter
    if (brand) {
      const brandSlugs = brand.split(",").filter(Boolean);
      const brands = await Brand.find({ slug: { $in: brandSlugs } });
      if (brands.length > 0) {
        const brandIds = brands.map((b) => b._id.toString());
        query.$and = query.$and || [];
        query.$and.push({ brand: { $in: brandIds } });
      } else {
        query._id = { $in: [] };
      }
    }

    // Gender filter
    if (gender) {
      const genders = gender.split(",").filter(Boolean);
      if (genders.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ gender: { $in: genders } });
      }
    }

    // Product type
    if (productType) {
      query.$and = query.$and || [];
      query.$and.push({ productType });
    }

    // Frame shape
    if (frameShape) {
      const shapes = frameShape.split(",").filter(Boolean);
      if (shapes.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: shapes.map((s) => ({
            frameShape: { $regex: s, $options: "i" },
          })),
        });
      }
    }

    // Lens type
    if (lensType) {
      const types = lensType.split(",").filter(Boolean);
      if (types.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: types.map((t) => ({ lensType: { $regex: t, $options: "i" } })),
        });
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating
    if (rating) query["ratings.average"] = { $gte: Number(rating) };

    // Flags
    if (isFeatured) query.isFeatured = true;
    if (isTrending) query.isTrending = true;
    if (isNewArrival) query.isNewArrival = true;
    if (isBestSeller) query.isBestSeller = true;

    // Sort
    let sortOption = { createdAt: -1 };
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
      case "popular":
        sortOption = { "ratings.count": -1 };
        break;
    }

    const skip = (Number(page) - 1) * Number(limit);

    console.log("MongoDB Query:", JSON.stringify(query, null, 2));

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
