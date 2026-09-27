// backend/models/Product.js

import mongoose from "mongoose";
import { getNextSequence } from "./Counter.js";

// ─────────────────────────────────────────────
// Reusable validators
// ─────────────────────────────────────────────
const isFiniteNonNegative = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

const stockValidator = {
  validator: (v) => {
    if (v === null || v === undefined) return true;
    if (typeof v === "string" && v.trim() === "") return false;
    return isFiniteNonNegative(v);
  },
  message: (props) =>
    `Stock must be a finite non-negative number (got: ${JSON.stringify(props.value)})`,
};

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

    price: { type: Number, default: 0, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    barcode: { type: String },
    category: { type: String },
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
      validate: stockValidator,
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

    variants: [
      {
        name: { type: String, required: true },
        sku: { type: String, sparse: true },
        price: { type: Number, required: true, default: 0, min: 0 },
        comparePrice: { type: Number, default: 0, min: 0 },

        stock: {
          type: Number,
          default: 0,
          min: 0,
          validate: stockValidator,
        },

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

    // ✅ PERSISTED FIELD — was a virtual returning `false` before.
    // Admin sets this explicitly, or it can be auto-maintained by
    // a future job based on order sales.
    isBestSeller: { type: Boolean, default: false, index: true },

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

// ✅ Keep isNewArrival virtual (computed from createdAt — does not need persistence).
productSchema.virtual("isNewArrival").get(function () {
  const daysSinceCreation =
    (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 30;
});

// ✅ REMOVED: virtual isBestSeller — it is now a real persisted field.

// ─────────────────────────────────────────────
// Pre-save: slug + defensive stock normalization
// ─────────────────────────────────────────────
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

  const normalizeStock = (raw, label) => {
    if (raw === null || raw === undefined || raw === "") return 0;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      const err = new Error(
        `Invalid stock value for ${label}: ${JSON.stringify(raw)}. ` +
          `Stock must be a finite non-negative number.`,
      );
      err.code = "INVALID_STOCK";
      throw err;
    }
    return Math.floor(n);
  };

  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.variants.forEach((variant) => {
      variant.stock = normalizeStock(
        variant.stock,
        `variant "${variant.name || "unnamed"}"`,
      );
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
      const s = Number(v.stock);
      totalStock += Number.isFinite(s) && s > 0 ? s : 0;
    });
    this.stock = totalStock;
  } else {
    this.stock = normalizeStock(this.stock, "product");
  }

  if (this.stock < 0) this.stock = 0;

  const finiteOrZero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  this.price = finiteOrZero(this.price);
  this.comparePrice = finiteOrZero(this.comparePrice);
  this.costPrice = finiteOrZero(this.costPrice);

  next();
});

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