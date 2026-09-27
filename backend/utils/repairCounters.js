// backend/utils/repairCounters.js
//
// Safe production repair utility for the Counter collection.
//
// Reads the highest existing sequential ID for each collection,
// compares it with the counter document, and RAISES the counter
// when the counter is behind. NEVER lowers a counter. Safe to run
// multiple times.
//
// Usage:
//   node utils/repairCounters.js
//
// Env:
//   MONGODB_URI must be set (production URI).

import mongoose from "mongoose";
import dotenv from "dotenv";
import Counter from "../models/Counter.js";

dotenv.config();

const extractMaxSeq = (values, prefix) => {
  let max = 0;
  for (const v of values) {
    if (!v || typeof v !== "string") continue;
    const m = v.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
};

const scanCollection = async (name, field, prefix) => {
  const collection = mongoose.connection.collection(name);
  const docs = await collection
    .find(
      { [field]: { $regex: `^${prefix}-\\d+$` } },
      { projection: { [field]: 1 } },
    )
    .toArray();
  const values = docs.map((d) => d[field]);
  return extractMaxSeq(values, prefix);
};

const repairOne = async (counterName, currentMax) => {
  const existing = await Counter.findById(counterName).lean();
  const counterSeq = existing?.seq || 0;

  if (currentMax <= counterSeq) {
    console.log(
      `  ✓ ${counterName}: counter=${counterSeq} >= max=${currentMax} (no change)`,
    );
    return {
      name: counterName,
      before: counterSeq,
      after: counterSeq,
      changed: false,
    };
  }

  await Counter.findByIdAndUpdate(
    counterName,
    { $max: { seq: currentMax } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(
    `  ↑ ${counterName}: counter ${counterSeq} → ${currentMax} (raised)`,
  );
  return {
    name: counterName,
    before: counterSeq,
    after: currentMax,
    changed: true,
  };
};

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set.");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log("Connected to MongoDB\n");
    console.log("Scanning collections for highest existing IDs...\n");

    const results = [];

    // User
    results.push(
      await repairOne("user", await scanCollection("users", "userId", "USR")),
    );

    // Product
    results.push(
      await repairOne(
        "product",
        await scanCollection("products", "productId", "PRD"),
      ),
    );

    // Order — orderId and orderNumber are both "ORD-..."
    const orderMaxId = await scanCollection("orders", "orderId", "ORD");
    const orderMaxNum = await scanCollection("orders", "orderNumber", "ORD");
    results.push(await repairOne("order", Math.max(orderMaxId, orderMaxNum)));

    // Category
    results.push(
      await repairOne(
        "category",
        await scanCollection("categories", "categoryId", "CAT"),
      ),
    );

    // Cart
    results.push(
      await repairOne("cart", await scanCollection("carts", "cartId", "CRT")),
    );

    // Coupon
    results.push(
      await repairOne(
        "coupon",
        await scanCollection("coupons", "couponId", "CPN"),
      ),
    );

    // Review
    results.push(
      await repairOne(
        "review",
        await scanCollection("reviews", "reviewId", "REV"),
      ),
    );

    // Blog
    results.push(
      await repairOne("blog", await scanCollection("blogs", "blogId", "BLG")),
    );

    const changed = results.filter((r) => r.changed).length;
    console.log(
      `\n✅ Done. ${changed} counter(s) raised. ${results.length - changed} unchanged.`,
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ repairCounters failed:", err.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

run();
