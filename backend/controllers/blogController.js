// backend/controllers/blogController.js

import Blog from "../models/Blog.js";
import BlogCategory from "../models/BlogCategory.js";
import BlogTag from "../models/BlogTag.js";
import { calculateBlogSeoScore } from "../utils/seoScore.js";

// ============================================
// BLOG CRUD
// ============================================

// @desc    Get published blogs (public)
// @route   GET /api/blogs
export const getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 9,
      category,
      tag,
      search,
      isFeatured,
    } = req.query;

    const query = { status: "published" };

    if (category) {
      const cat = await BlogCategory.findOne({ slug: category });
      if (cat) query.category = cat._id;
      else query._id = { $in: [] };
    }

    if (tag) {
      const t = await BlogTag.findOne({ slug: tag });
      if (t) query.tags = t._id;
      else query._id = { $in: [] };
    }

    if (isFeatured === "true") query.isFeatured = true;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .sort("-publishedAt -createdAt")
        .skip(skip)
        .limit(Number(limit))
        .select("-content -seo -seoScore"),
      Blog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      blogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single blog by slug (public)
// @route   GET /api/blogs/:slug
// @access  Public
//
//  ✓ Returns full blog
//  ✓ Returns related blogs (same category/tags, fallback recent)
//  ✓ Returns sidebar products (from blog.products if present, else recent active products)
export const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    })
      .populate("category", "name slug")
      .populate("tags", "name slug");

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // Views increment — non-blocking
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).catch(() => {});

    // ── Related blogs: same category OR shared tags, else recent ──
    const relatedQuery = {
      _id: { $ne: blog._id },
      status: "published",
    };

    let relatedBlogs = [];
    if (blog.category || (blog.tags && blog.tags.length > 0)) {
      const orClauses = [];
      if (blog.category) orClauses.push({ category: blog.category._id });
      if (blog.tags && blog.tags.length > 0)
        orClauses.push({ tags: { $in: blog.tags.map((t) => t._id) } });

      relatedBlogs = await Blog.find({ ...relatedQuery, $or: orClauses })
        .sort("-publishedAt")
        .limit(3)
        .select("title slug featuredImage excerpt publishedAt readTime");
    }

    // Fallback / fill up to 3 with recent
    if (relatedBlogs.length < 3) {
      const excludeIds = [blog._id, ...relatedBlogs.map((b) => b._id)];
      const fillCount = 3 - relatedBlogs.length;
      const filler = await Blog.find({
        _id: { $nin: excludeIds },
        status: "published",
      })
        .sort("-publishedAt")
        .limit(fillCount)
        .select("title slug featuredImage excerpt publishedAt readTime");
      relatedBlogs = [...relatedBlogs, ...filler];
    }

    // ── Sidebar products ──
    // Try to use products referenced by the blog's Product Showcase blocks.
    // Falls back to recent active products.
    let sidebarProducts = [];
    try {
      const Product = (await import("../models/Product.js")).default;

      // Extract product IDs from content blocks
      let referencedIds = [];
      try {
        const blocks = JSON.parse(blog.content);
        if (Array.isArray(blocks)) {
          blocks.forEach((b) => {
            if (
              b.type === "productShowcase" &&
              Array.isArray(b.data?.products)
            ) {
              b.data.products.forEach((p) => {
                const id = typeof p === "string" ? p : p?._id;
                if (id) referencedIds.push(id);
              });
            }
          });
        }
      } catch {
        /* not JSON — skip */
      }

      if (referencedIds.length > 0) {
        sidebarProducts = await Product.find({
          _id: { $in: referencedIds },
          isActive: true,
        })
          .limit(4)
          .select(
            "name slug price comparePrice images brand ratings stock isActive",
          )
          .populate("brand", "name slug");
      }

      // Fill up to 3 with recent active products
      if (sidebarProducts.length < 3) {
        const excludeIds = sidebarProducts.map((p) => p._id);
        const fillCount = 3 - sidebarProducts.length;
        const recent = await Product.find({
          _id: { $nin: excludeIds },
          isActive: true,
          stock: { $gt: 0 },
        })
          .sort("-createdAt")
          .limit(fillCount)
          .select(
            "name slug price comparePrice images brand ratings stock isActive",
          )
          .populate("brand", "name slug");
        sidebarProducts = [...sidebarProducts, ...recent];
      }
    } catch (e) {
      console.error("Sidebar products error:", e.message);
    }

    res.status(200).json({
      success: true,
      blog,
      relatedBlogs,
      sidebarProducts,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get blogs (admin - includes drafts)
// @route   GET /api/blogs/admin/all
export const getAdminBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .select("-content"),
      Blog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      blogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single blog (admin - includes drafts, by ID)
// @route   GET /api/blogs/admin/:id
// @access  Private/Admin
export const getAdminBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("category", "name slug")
      .populate("tags", "name slug");

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // ✅ Flatten category + tags to plain IDs so the form can bind cleanly.
    // The frontend still gets the populated objects via `_populated` if it needs them.
    const blogObj = blog.toObject();
    const rawCategoryId =
      blogObj.category && typeof blogObj.category === "object"
        ? blogObj.category._id
        : blogObj.category || "";
    const rawTagIds = (blogObj.tags || []).map((t) =>
      typeof t === "object" ? t._id : t,
    );

    blogObj.category = rawCategoryId;
    blogObj.tags = rawTagIds;

    const { score, checks } = calculateBlogSeoScore(blog);

    res
      .status(200)
      .json({ success: true, blog: blogObj, seo: { score, checks } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Calculate SEO score for blog data (no save)
// @route   POST /api/blogs/seo-check
export const checkSeoScore = async (req, res) => {
  try {
    const { score, checks } = calculateBlogSeoScore(req.body);
    res.status(200).json({ success: true, seo: { score, checks } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create blog (admin)
export const createBlog = async (req, res) => {
  try {
    const { score } = calculateBlogSeoScore(req.body);
    const wordCount =
      req.body.content
        ?.replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter(Boolean).length || 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const blog = await Blog.create({
      ...req.body,
      seoScore: score,
      readTime,
    });

    const populated = await Blog.findById(blog._id)
      .populate("category", "name slug")
      .populate("tags", "name slug");

    res.status(201).json({ success: true, blog: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update blog (admin)
export const updateBlog = async (req, res) => {
  try {
    const { score } = calculateBlogSeoScore(req.body);
    const wordCount =
      req.body.content
        ?.replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter(Boolean).length || 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { ...req.body, seoScore: score, readTime },
      { new: true, runValidators: true },
    )
      .populate("category", "name slug")
      .populate("tags", "name slug");

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete blog (admin)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle blog status (draft/published)
export const toggleBlogStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    blog.status = blog.status === "published" ? "draft" : "published";
    if (blog.status === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// BLOG CATEGORY CRUD  (unchanged)
// ============================================

export const getBlogCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === "true" ? {} : { isActive: true };
    const categories = await BlogCategory.find(query).sort("name");

    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await Blog.countDocuments({
          category: cat._id,
          status: "published",
        });
        return { ...cat.toObject(), blogCount: count };
      }),
    );

    res.status(200).json({ success: true, categories: withCounts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createBlogCategory = async (req, res) => {
  try {
    const category = await BlogCategory.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBlogCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBlogCategory = async (req, res) => {
  try {
    const usedCount = await Blog.countDocuments({ category: req.params.id });
    if (usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${usedCount} blog(s) use this category`,
      });
    }
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// BLOG TAG CRUD (unchanged)
// ============================================

export const getBlogTags = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === "true" ? {} : { isActive: true };
    const tags = await BlogTag.find(query).sort("name");

    const withCounts = await Promise.all(
      tags.map(async (tag) => {
        const count = await Blog.countDocuments({
          tags: tag._id,
          status: "published",
        });
        return { ...tag.toObject(), blogCount: count };
      }),
    );

    res.status(200).json({ success: true, tags: withCounts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createBlogTag = async (req, res) => {
  try {
    const tag = await BlogTag.create(req.body);
    res.status(201).json({ success: true, tag });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBlogTag = async (req, res) => {
  try {
    const tag = await BlogTag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });
    res.status(200).json({ success: true, tag });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBlogTag = async (req, res) => {
  try {
    const usedCount = await Blog.countDocuments({ tags: req.params.id });
    if (usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${usedCount} blog(s) use this tag`,
      });
    }
    const tag = await BlogTag.findByIdAndDelete(req.params.id);
    if (!tag)
      return res.status(404).json({ success: false, message: "Tag not found" });
    res.status(200).json({ success: true, message: "Tag deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
