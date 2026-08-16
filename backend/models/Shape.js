import mongoose from "mongoose";

const shapeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shape name is required"],
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

shapeSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

const Shape = mongoose.model("Shape", shapeSchema);
export default Shape;
