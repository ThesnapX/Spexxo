// backend/models/Category.js

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
    },
    image: {
      url: String,
      alt: String,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    productType: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

// Generate categoryId before saving
categorySchema.pre("save", async function (next) {
  if (this.isNew && !this.categoryId) {
    const count = await mongoose.model("Category").countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, "0");
    this.categoryId = `CAT-${nextNumber}`;
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
