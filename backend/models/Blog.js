// backend/models/Blog.js

import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    blogId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      maxlength: 200,
    },
    featuredImage: {
      url: String,
      alt: String,
    },
    category: {
      type: String,
      enum: [
        "eyeglasses",
        "sunglasses",
        "contact-lens",
        "eye-care",
        "fashion",
        "technology",
        "general",
      ],
    },
    tags: [String],
    author: {
      type: String,
      default: "Spexxo Team",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
      ogImage: String,
    },
    readTime: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Generate blogId before saving
blogSchema.pre("save", async function (next) {
  if (this.isNew && !this.blogId) {
    const count = await mongoose.model("Blog").countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, "0");
    this.blogId = `BLG-${nextNumber}`;
  }
  next();
});

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
