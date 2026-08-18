// backend/models/Product.js

import mongoose from "mongoose";

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
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    comparePrice: {
      type: Number,
    },
    costPrice: {
      type: Number,
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
      type: String, // Stores comma-separated IDs like "id1,id2,id3"
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      default: "unisex",
    },
    productType: {
      type: String,
      enum: ["eyeglasses", "sunglasses", "contactlens"],
      required: true,
    },
    frameShape: {
      type: String,
    },
    frameMaterial: {
      type: String,
    },
    lensType: {
      type: String,
    },
    frameColor: {
      type: String,
    },
    frameWidth: {
      type: Number,
    },
    lensWidth: {
      type: Number,
    },
    frameHeight: {
      type: Number,
    },
    bridge: {
      type: Number,
    },
    lensMaterial: {
      type: String,
    },
    size: {
      type: String,
    },
    images: [
      {
        url: String,
        alt: String,
        isMain: {
          type: Boolean,
          default: false,
        },
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
        name: String,
        sku: String,
        price: Number,
        comparePrice: Number,
        stock: {
          type: Number,
          default: 0,
        },
        attributes: {
          color: String,
          size: String,
          material: String,
        },
      },
    ],
    stock: {
      type: Number,
      default: 0,
    },
    isInStock: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    specifications: [
      {
        name: String,
        value: String,
      },
    ],
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: String,
      ogImage: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Create slug from name
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

// Generate productId before saving
productSchema.pre("save", async function (next) {
  if (this.isNew && !this.productId) {
    const count = await mongoose.model("Product").countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, "0");
    this.productId = `PRD-${nextNumber}`;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
