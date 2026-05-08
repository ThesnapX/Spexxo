import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
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
      // Can be single type or comma-separated: "eyeglasses,sunglasses"
      default: "",
    },
    gender: {
      type: String,
      // Can be single or comma-separated: "men,women,kids"
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

const Category = mongoose.model("Category", categorySchema);
export default Category;
