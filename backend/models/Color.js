import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      trim: true,
      unique: true,
    },
    hexCode: {
      type: String,
      default: "#000000",
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

colorSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

const Color = mongoose.model("Color", colorSchema);
export default Color;
