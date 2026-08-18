// backend/utils/createIndexes.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // User indexes
    await mongoose.connection.collection("users").createIndex({ email: 1 });
    await mongoose.connection.collection("users").createIndex({ phone: 1 });
    await mongoose.connection.collection("users").createIndex({ username: 1 });
    await mongoose.connection
      .collection("users")
      .createIndex({ customerId: 1 });

    // Product indexes
    await mongoose.connection.collection("products").createIndex({ slug: 1 });
    await mongoose.connection.collection("products").createIndex({ sku: 1 });
    await mongoose.connection
      .collection("products")
      .createIndex({ category: 1 });
    await mongoose.connection.collection("products").createIndex({ brand: 1 });
    await mongoose.connection
      .collection("products")
      .createIndex({ productType: 1 });
    await mongoose.connection
      .collection("products")
      .createIndex({ isActive: 1 });
    await mongoose.connection
      .collection("products")
      .createIndex({ isFeatured: 1 });
    await mongoose.connection
      .collection("products")
      .createIndex({ isTrending: 1 });

    // Order indexes
    await mongoose.connection
      .collection("orders")
      .createIndex({ orderNumber: 1 });
    await mongoose.connection.collection("orders").createIndex({ user: 1 });
    await mongoose.connection
      .collection("orders")
      .createIndex({ orderStatus: 1 });
    await mongoose.connection
      .collection("orders")
      .createIndex({ createdAt: -1 });

    // Other indexes
    await mongoose.connection.collection("categories").createIndex({ slug: 1 });
    await mongoose.connection.collection("brands").createIndex({ slug: 1 });
    await mongoose.connection
      .collection("reviews")
      .createIndex({ product: 1, user: 1 });

    console.log("✅ All indexes created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
};

createIndexes();
