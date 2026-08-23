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
    stock: {
      type: Number,
      default: 0,
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
        name: {
          type: String,
          required: true,
        },
        sku: {
          type: String,
          sparse: true,
        },
        price: {
          type: Number,
          required: true,
        },
        comparePrice: {
          type: Number,
        },
        stock: {
          type: Number,
          default: 0,
        },
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Color",
          default: null,
        },
        // ... other fields
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
        isDefault: {
          type: Boolean,
          default: false,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ✅ DYNAMIC VIRTUALS - New Arrival (based on age)
productSchema.virtual("isNewArrival").get(function () {
  const daysSinceCreation =
    (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 30;
});

// ✅ DYNAMIC VIRTUALS - Best Seller (based on sales - placeholder for now)
productSchema.virtual("isBestSeller").get(function () {
  return false;
});

// ✅ Pre-save hook to set main product images from first variant if no images
productSchema.pre("save", function (next) {
  // Create slug from name
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }

  // Set productCategory from productTypeOld for backward compatibility
  if (this.isModified("productTypeOld") && this.productTypeOld) {
    this.productCategory = this.productTypeOld;
  }

  // ✅ If product has variants and no main images, use first variant's images
  if (this.variants && this.variants.length > 0) {
    // Remove isDefault from all variants
    this.variants.forEach((variant) => {
      delete variant.isDefault;
    });

    // If no main images, use first variant's images
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
