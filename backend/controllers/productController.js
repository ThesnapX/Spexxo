// backend/controllers/productController.js

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
      productCategory,
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
      hideOutOfStock = "true",
    } = req.query;

    const query = {};

    // If includeInactive is not true, only show active products
    if (includeInactive !== "true") {
      query.isActive = true;
    }

    // Stock filter - check both main stock AND variants
    if (hideOutOfStock !== "false" && includeInactive !== "true") {
      query.$or = [
        { stock: { $gt: 0 } },
        { variants: { $elemMatch: { stock: { $gt: 0 } } } },
      ];
    }

    // ✅ PRICE FILTER - Handles both simple and variant products
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);

      const priceConditions = [{ price: priceFilter }];

      if (priceFilter.$gte !== undefined || priceFilter.$lte !== undefined) {
        priceConditions.push({
          variants: {
            $elemMatch: {
              price: priceFilter,
            },
          },
        });
      }

      if (query.$or) {
        const stockOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: stockOr }, { $or: priceConditions }];
      } else {
        query.$or = priceConditions;
      }
    }

    // ✅ UNIVERSAL SEARCH
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };

      const matchingCategories = await Category.find({
        name: searchRegex,
      }).select("_id");

      const matchingBrands = await Brand.find({
        name: searchRegex,
      }).select("_id");

      const categoryIds = matchingCategories.map((c) => c._id.toString());
      const brandIds = matchingBrands.map((b) => b._id.toString());

      const searchTerms = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
        { frameShape: searchRegex },
        { frameMaterial: searchRegex },
        { lensType: searchRegex },
        { frameColor: searchRegex },
        { gender: searchRegex },
        { productCategory: searchRegex },
        ...categoryIds.map((id) => ({
          category: { $regex: id, $options: "i" },
        })),
        ...brandIds.map((id) => ({ brand: id })),
      ];

      if (query.$or) {
        const existingOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: existingOr }, { $or: searchTerms }];
      } else {
        query.$or = searchTerms;
      }
    }

    // Category filter
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        const catId = cat._id.toString();
        if (query.$and) {
          query.$and.push({ category: { $regex: catId, $options: "i" } });
        } else {
          query.category = { $regex: catId, $options: "i" };
        }
      } else {
        query._id = { $in: [] };
      }
    }

    // Brand filter
    if (brand) {
      const brandSlugs = brand.split(",").filter(Boolean);
      const brands = await Brand.find({ slug: { $in: brandSlugs } });
      if (brands.length > 0) {
        const brandIds = brands.map((b) => b._id.toString());
        if (query.$and) {
          query.$and.push({ brand: { $in: brandIds } });
        } else {
          query.brand = { $in: brandIds };
        }
      } else {
        query._id = { $in: [] };
      }
    }

    // Gender filter
    if (gender) {
      const genders = gender.split(",").filter(Boolean);
      if (genders.length > 0) {
        if (query.$and) {
          query.$and.push({ gender: { $in: genders } });
        } else {
          query.gender = { $in: genders };
        }
      }
    }

    // Product Category filter (eyeglasses, sunglasses, contactlens)
    if (productCategory) {
      if (query.$and) {
        query.$and.push({ productCategory: productCategory });
      } else {
        query.productCategory = productCategory;
      }
    }

    // Frame shape
    if (frameShape) {
      const shapes = frameShape.split(",").filter(Boolean);
      if (shapes.length > 0) {
        if (query.$and) {
          query.$and.push({
            frameShape: { $regex: shapes.join("|"), $options: "i" },
          });
        } else {
          query.frameShape = { $regex: shapes.join("|"), $options: "i" };
        }
      }
    }

    // Lens type
    if (lensType) {
      const types = lensType.split(",").filter(Boolean);
      if (types.length > 0) {
        if (query.$and) {
          query.$and.push({
            lensType: { $regex: types.join("|"), $options: "i" },
          });
        } else {
          query.lensType = { $regex: types.join("|"), $options: "i" };
        }
      }
    }

    // Rating
    if (rating) {
      if (query.$and) {
        query.$and.push({ "ratings.average": { $gte: Number(rating) } });
      } else {
        query["ratings.average"] = { $gte: Number(rating) };
      }
    }

    // Flags
    if (isFeatured === "true") {
      if (query.$and) {
        query.$and.push({ isFeatured: true });
      } else {
        query.isFeatured = true;
      }
    }
    if (isTrending === "true") {
      if (query.$and) {
        query.$and.push({ isTrending: true });
      } else {
        query.isTrending = true;
      }
    }
    if (isBestSeller === "true") {
      if (query.$and) {
        query.$and.push({ isBestSeller: true });
      } else {
        query.isBestSeller = true;
      }
    }

    // New Arrivals
    if (isNewArrival === "true") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newArrivalCondition = {
        $or: [{ isNewArrival: true }, { createdAt: { $gte: thirtyDaysAgo } }],
      };

      if (query.$and) {
        query.$and.push(newArrivalCondition);
      } else {
        query.$and = [newArrivalCondition];
      }
    }

    // ✅ FIXED: Sort options with proper price sorting for variable products
    let sortOption = { createdAt: -1 };

    switch (sort) {
      case "price-low":
        // For price low to high, we need to sort by the minimum price
        // For simple products: use price field
        // For variable products: use the minimum price from variants
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
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "name-asc":
        sortOption = { name: 1 };
        break;
      case "name-desc":
        sortOption = { name: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ FIXED: For price sorting, we need to handle variable products differently
    // We need to get all products and sort them in memory for variable products
    let products = [];
    let total = 0;

    // For price sorting, we need to handle variable products specially
    if (sort === "price-low" || sort === "price-high") {
      // Get all products matching the query (without pagination first)
      const allProducts = await Product.find(query)
        .populate("brand", "name slug logo")
        .lean();

      // Calculate effective price for each product
      const productsWithPrice = allProducts.map((product) => {
        let effectivePrice = product.price || 0;

        // If product has variants, find the minimum price among variants
        if (product.variants && product.variants.length > 0) {
          const variantPrices = product.variants.map((v) => v.price || 0);
          const minVariantPrice = Math.min(...variantPrices);
          // Use comparePrice if available and less than price
          const comparePrice = product.comparePrice || 0;
          effectivePrice =
            comparePrice > 0 && comparePrice < minVariantPrice
              ? comparePrice
              : minVariantPrice;
        } else {
          // Simple product - use comparePrice if available
          const comparePrice = product.comparePrice || 0;
          effectivePrice =
            comparePrice > 0 && comparePrice < product.price
              ? comparePrice
              : product.price || 0;
        }

        return { ...product, effectivePrice };
      });

      // Sort by effective price
      productsWithPrice.sort((a, b) => {
        if (sort === "price-low") {
          return a.effectivePrice - b.effectivePrice;
        } else {
          return b.effectivePrice - a.effectivePrice;
        }
      });

      total = productsWithPrice.length;

      // Apply pagination
      products = productsWithPrice.slice(skip, skip + Number(limit));

      // Convert back to plain objects
      products = products.map((p) => {
        const { effectivePrice, ...rest } = p;
        return rest;
      });
    } else {
      // For non-price sorting, use regular query with pagination
      const result = await Product.find(query)
        .populate("brand", "name slug logo")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      products = result;
      total = await Product.countDocuments(query);
    }

    // Get all categories for name lookup
    const allCategories = await Category.find({});
    const categoryMap = {};
    allCategories.forEach((cat) => {
      categoryMap[cat._id.toString()] = cat;
    });

    const productsWithCategories = products.map((product) => {
      const productObj = { ...product };
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
        { productCategory: product.productCategory },
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
