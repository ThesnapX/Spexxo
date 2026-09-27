// backend/utils/migrateAddBestSeller.js
//
// One-time, idempotent migration.
//
// Adds the new `isBestSeller: false` field to any product document that
// doesn't yet have it (docs created before this schema change).
//
// Safe to run multiple times. Never overwrites an existing value.

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

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

    const result = await Product.updateMany(
      { isBestSeller: { $exists: false } },
      { $set: { isBestSeller: false } },
    );

    console.log(
      `✅ Migration complete. Added isBestSeller to ${result.modifiedCount} products.`,
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

run();
