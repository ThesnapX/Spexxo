import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
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
    },
    barcode: {
      type: String,
    },
    category: {
      type: String, // Now stores comma-separated IDs like "id1,id2,id3"
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
      // Supports multiple values like "Rectangle,Round,Cat Eye"
    },
    frameMaterial: {
      type: String,
      // Supports multiple values like "Metal,Acetate,Titanium"
    },
    lensType: {
      type: String,
      // Supports multiple values like "Blue Cut,UV Protection,Polarized"
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
    frameColor: {
      type: String,
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

const Product = mongoose.model("Product", productSchema);
export default Product;
