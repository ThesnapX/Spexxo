import mongoose from "mongoose";

const frameMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Frame material name is required"],
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

frameMaterialSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

const FrameMaterial = mongoose.model("FrameMaterial", frameMaterialSchema);
export default FrameMaterial;
