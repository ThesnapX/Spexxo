// backend/models/Product.js

import mongoose from "mongoose";
import { getNextSequence } from "./Counter.js";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    shortDescription: {
      type: String,
    },

    productType: {
      type: String,
      enum: ["simple", "variable"],
      default: "simple",
    },

    productCategory: {
      type: String,
      enum: ["eyeglasses", "sunglasses", "contactlens"],
    },

    price: {
      type: Number,
      default: 0,
    },
    comparePrice: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
    },
    category: {
      type: String,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      default: "unisex",
    },
    productTypeOld: {
      type: String,
      enum: ["eyeglasses", "sunglasses", "contactlens"],
    },

    // Simple Product Fields
    frameShape: { type: String },
    frameMaterial: { type: String },
    lensType: { type: String },
    frameColor: { type: String },
    frameWidth: { type: Number },
    lensWidth: { type: Number },
    frameHeight: { type: Number },
    bridge: { type: Number },
    lensMaterial: { type: String },
    size: { type: String },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [
      {
        url: String,
        alt: String,
        isMain: { type: Boolean, default: false },
      },
    ],
    gallery: [
      {
        url: String,
        alt: String,
      },
    ],

    // VARIANT PRODUCT FIELDS
    variants: [
      {
        name: { type: String, required: true },
        sku: { type: String, sparse: true },
        price: { type: Number, required: true, default: 0 },
        comparePrice: { type: Number, default: 0 },
        stock: { type: Number, default: 0, min: 0 },
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Color",
          default: null,
        },
        frameShape: { type: String },
        frameMaterial: { type: String },
        lensType: { type: String },
        frameColor: { type: String },
        frameWidth: { type: Number },
        lensWidth: { type: Number },
        frameHeight: { type: Number },
        bridge: { type: Number },
        images: [
          {
            url: String,
            alt: String,
            isMain: { type: Boolean, default: false },
          },
        ],
        attributes: {
          color: String,
          size: String,
          material: String,
        },
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
      },
    ],

    isInStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },

    specifications: [
      {
        name: String,
        value: String,
      },
    ],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
      ogImage: String,
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ✅ DYNAMIC VIRTUALS
productSchema.virtual("isNewArrival").get(function () {
  const daysSinceCreation =
    (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 30;
});

productSchema.virtual("isBestSeller").get(function () {
  return false;
});

// ✅ Pre-save hook for slug + stock
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }

  if (this.isModified("productTypeOld") && this.productTypeOld) {
    this.productCategory = this.productTypeOld;
  }

  if (this.variants && this.variants.length > 0) {
    this.variants.forEach((variant) => {
      if (
        variant.stock === undefined ||
        variant.stock === null ||
        isNaN(variant.stock)
      ) {
        variant.stock = 0;
      }
      variant.stock = Number(variant.stock);
    });

    if (
      (!this.images || this.images.length === 0) &&
      this.variants[0].images &&
      this.variants[0].images.length > 0
    ) {
      this.images = this.variants[0].images.map((img) => ({
        url: img.url,
        alt: img.alt || this.name,
        isMain: false,
      }));
    }

    let totalStock = 0;
    this.variants.forEach((v) => {
      const variantStock = Number(v.stock) || 0;
      totalStock += variantStock;
    });
    this.stock = totalStock;
  } else {
    if (this.stock === undefined || this.stock === null || isNaN(this.stock)) {
      this.stock = 0;
    }
    this.stock = Number(this.stock);
  }

  if (this.stock < 0) this.stock = 0;

  next();
});

// ✅ Atomic productId generation — race-safe
productSchema.pre("save", async function (next) {
  if (this.isNew && !this.productId) {
    try {
      const seq = await getNextSequence("product");
      this.productId = `PRD-${seq.toString().padStart(6, "0")}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
