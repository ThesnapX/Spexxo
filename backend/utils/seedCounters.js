// backend/utils/seedCounters.js
// One-time script: initialise Counter collection from existing data.
// Safe to run multiple times — it only raises the sequence, never lowers it.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { getNextSequence } from "../models/Counter.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Review from "../models/Review.js";
import Blog from "../models/Blog.js";

dotenv.config();

const extractMaxSeq = (docs, field, prefix) => {
  let max = 0;
  for (const doc of docs) {
    const value = doc[field];
    if (!value || typeof value !== "string") continue;
    const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
};

const bumpCounter = async (name, currentMax) => {
  if (currentMax <= 0) return;
  // Advance the counter to `currentMax` so next call returns currentMax + 1
  const Counter = mongoose.model("Counter");
  await Counter.findByIdAndUpdate(
    name,
    { $max: { seq: currentMax } }, // $max never lowers the value
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`  ✅ ${name} counter >= ${currentMax}`);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    console.log("Seeding counters from existing data...\n");

    const products = await Product.find().select("productId").lean();
    await bumpCounter("product", extractMaxSeq(products, "productId", "PRD"));

    const orders = await Order.find().select("orderId orderNumber").lean();
    const orderMax = Math.max(
      extractMaxSeq(orders, "orderId", "ORD"),
      extractMaxSeq(orders, "orderNumber", "ORD"),
    );
    await bumpCounter("order", orderMax);

    const users = await User.find().select("userId customerId").lean();
    const userMax = Math.max(
      extractMaxSeq(users, "userId", "USR"),
      extractMaxSeq(users, "customerId", "CUST"),
    );
    await bumpCounter("user", userMax);

    const categories = await Category.find().select("categoryId").lean();
    await bumpCounter(
      "category",
      extractMaxSeq(categories, "categoryId", "CAT"),
    );

    const carts = await Cart.find().select("cartId").lean();
    await bumpCounter("cart", extractMaxSeq(carts, "cartId", "CRT"));

    const coupons = await Coupon.find().select("couponId").lean();
    await bumpCounter("coupon", extractMaxSeq(coupons, "couponId", "CPN"));

    const reviews = await Review.find().select("reviewId").lean();
    await bumpCounter("review", extractMaxSeq(reviews, "reviewId", "REV"));

    const blogs = await Blog.find().select("blogId").lean();
    await bumpCounter("blog", extractMaxSeq(blogs, "blogId", "BLG"));

    console.log("\n✅ Counter seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Counter seeding failed:", error.message);
    process.exit(1);
  }
};

run();
