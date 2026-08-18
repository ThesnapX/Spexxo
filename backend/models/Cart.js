// backend/models/Cart.js

import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    cartId: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Generate cartId before saving
cartSchema.pre("save", async function (next) {
  if (this.isNew && !this.cartId) {
    const count = await mongoose.model("Cart").countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, "0");
    this.cartId = `CRT-${nextNumber}`;
  }
  next();
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
