// backend/controllers/productController.js

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import {
  clampPagination,
  sanitizeSearch,
  parseFiniteNumber,
  parseCsvList,
} from "../utils/validation.js";

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
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

    const { page, limit, skip } = clampPagination(
      req.query.page,
      req.query.limit,
      {
        defaultLimit: 12,
        maxLimit: 100,
      },
    );

    const query = {};

    if (includeInactive !== "true") {
      query.isActive = true;
    }

    if (hideOutOfStock !== "false" && includeInactive !== "true") {
      query.$or = [
        { stock: { $gt: 0 } },
        { variants: { $elemMatch: { stock: { $gt: 0 } } } },
      ];
    }

    // Price filter
    const minP = parseFiniteNumber(minPrice, null);
    const maxP = parseFiniteNumber(maxPrice, null);
    if (minP !== null || maxP !== null) {
      const priceFilter = {};
      if (minP !== null && minP >= 0) priceFilter.$gte = minP;
      if (maxP !== null && maxP >= 0) priceFilter.$lte = maxP;

      const priceConditions = [{ price: priceFilter }];
      priceConditions.push({
        variants: { $elemMatch: { price: priceFilter } },
      });

      if (query.$or) {
        const stockOr = query.$or;
        delete query.$or;
        query.$and = [{ $or: stockOr }, { $or: priceConditions }];
      } else {
        query.$or = priceConditions;
      }
    }

    // Search — sanitized
    const safeSearch = sanitizeSearch(search, 100);
    if (safeSearch) {
      const searchRegex = { $regex: safeSearch, $options: "i" };

      const matchingCategories = await Category.find({
        name: searchRegex,
      })
        .select("_id")
        .limit(50);

      const matchingBrands = await Brand.find({ name: searchRegex })
        .select("_id")
        .limit(50);

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

    // Category
    if (category && typeof category === "string") {
      const cat = await Category.findOne({
        slug: category.slice(0, 80),
      });
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

    // Brand
    if (brand) {
      const brandSlugs = parseCsvList(brand, { maxItems: 30, maxLen: 60 });
      const brands = await Brand.find({ slug: { $in: brandSlugs } }).select(
        "_id",
      );
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

    // Gender
    if (gender) {
      const genders = parseCsvList(gender, { maxItems: 4, maxLen: 20 });
      const validGenders = ["men", "women", "unisex", "kids"].filter((g) =>
        genders.includes(g),
      );
      if (validGenders.length > 0) {
        if (query.$and) {
          query.$and.push({ gender: { $in: validGenders } });
        } else {
          query.gender = { $in: validGenders };
        }
      }
    }

    // Product category
    if (productCategory) {
      const valid = ["eyeglasses", "sunglasses", "contactlens"];
      const value = String(productCategory).toLowerCase();
      if (valid.includes(value)) {
        if (query.$and) {
          query.$and.push({ productCategory: value });
        } else {
          query.productCategory = value;
        }
      }
    }

    // Frame shape — sanitize
    if (frameShape) {
      const shapes = parseCsvList(frameShape, { maxItems: 10, maxLen: 40 });
      if (shapes.length > 0) {
        const safeRegex = sanitizeSearch(shapes.join("|"), 200);
        if (safeRegex) {
          if (query.$and) {
            query.$and.push({
              frameShape: { $regex: safeRegex, $options: "i" },
            });
          } else {
            query.frameShape = { $regex: safeRegex, $options: "i" };
          }
        }
      }
    }

    // Lens type — sanitize
    if (lensType) {
      const types = parseCsvList(lensType, { maxItems: 10, maxLen: 40 });
      if (types.length > 0) {
        const safeRegex = sanitizeSearch(types.join("|"), 200);
        if (safeRegex) {
          if (query.$and) {
            query.$and.push({ lensType: { $regex: safeRegex, $options: "i" } });
          } else {
            query.lensType = { $regex: safeRegex, $options: "i" };
          }
        }
      }
    }

    // Rating
    const ratingNum = parseFiniteNumber(rating, null);
    if (ratingNum !== null && ratingNum >= 0) {
      if (query.$and) {
        query.$and.push({ "ratings.average": { $gte: ratingNum } });
      } else {
        query["ratings.average"] = { $gte: ratingNum };
      }
    }

    // Flags
    if (isFeatured === "true") {
      if (query.$and) query.$and.push({ isFeatured: true });
      else query.isFeatured = true;
    }
    if (isTrending === "true") {
      if (query.$and) query.$and.push({ isTrending: true });
      else query.isTrending = true;
    }
    if (isBestSeller === "true") {
      if (query.$and) query.$and.push({ isBestSeller: true });
      else query.isBestSeller = true;
    }

    // New arrivals
    if (isNewArrival === "true") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newArrivalCondition = {
        $or: [{ isNewArrival: true }, { createdAt: { $gte: thirtyDaysAgo } }],
      };
      if (query.$and) query.$and.push(newArrivalCondition);
      else query.$and = [newArrivalCondition];
    }

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

    let products = [];
    let total = 0;

    if (sort === "price-low" || sort === "price-high") {
      // Fetch, compute effective price, sort in memory, paginate.
      // Cap at a sane upper bound to prevent OOM on huge catalogs.
      const allProducts = await Product.find(query)
        .populate("brand", "name slug logo")
        .limit(2000)
        .lean();

      const productsWithPrice = allProducts.map((product) => {
        let effectivePrice = product.price || 0;
        if (product.variants && product.variants.length > 0) {
          const variantPrices = product.variants.map((v) => v.price || 0);
          const minVariantPrice = Math.min(...variantPrices);
          const comparePrice = product.comparePrice || 0;
          effectivePrice =
            comparePrice > 0 && comparePrice < minVariantPrice
              ? comparePrice
              : minVariantPrice;
        } else {
          const comparePrice = product.comparePrice || 0;
          effectivePrice =
            comparePrice > 0 && comparePrice < product.price
              ? comparePrice
              : product.price || 0;
        }
        return { ...product, effectivePrice };
      });

      productsWithPrice.sort((a, b) =>
        sort === "price-low"
          ? a.effectivePrice - b.effectivePrice
          : b.effectivePrice - a.effectivePrice,
      );

      total = productsWithPrice.length;
      products = productsWithPrice
        .slice(skip, skip + limit)
        .map(({ effectivePrice, ...rest }) => rest);
    } else {
      const result = await Product.find(query)
        .populate("brand", "name slug logo")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean();

      products = result;
      total = await Product.countDocuments(query);
    }

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
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    res
      .status(400)
      .json({ success: false, message: "Failed to load products" });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const safeSlug = String(slug).slice(0, 200);

    let product = await Product.findOne({
      slug: safeSlug,
      isActive: true,
    }).populate("brand", "name slug logo");

    if (!product && /^[0-9a-fA-F]{24}$/.test(safeSlug)) {
      product = await Product.findById(safeSlug).populate(
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
    res.status(400).json({ success: false, message: "Failed to load product" });
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
