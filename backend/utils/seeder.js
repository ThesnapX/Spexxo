import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import Product from "../models/Product.js";

dotenv.config();

const categories = [
  {
    name: "Men Eyeglasses",
    productType: "eyeglasses",
    gender: "men",
    sortOrder: 1,
  },
  {
    name: "Women Eyeglasses",
    productType: "eyeglasses",
    gender: "women",
    sortOrder: 2,
  },
  {
    name: "Kids Eyeglasses",
    productType: "eyeglasses",
    gender: "kids",
    sortOrder: 3,
  },
  {
    name: "Men Sunglasses",
    productType: "sunglasses",
    gender: "men",
    sortOrder: 4,
  },
  {
    name: "Women Sunglasses",
    productType: "sunglasses",
    gender: "women",
    sortOrder: 5,
  },
  {
    name: "Contact Lenses",
    productType: "contactlens",
    gender: "unisex",
    sortOrder: 6,
  },
  {
    name: "Blue Cut Glasses",
    productType: "eyeglasses",
    gender: "unisex",
    sortOrder: 7,
  },
  {
    name: "Progressive Lenses",
    productType: "eyeglasses",
    gender: "unisex",
    sortOrder: 8,
  },
];

const brands = [
  { name: "Ray-Ban", description: "Premium eyewear brand" },
  { name: "Oakley", description: "Sports performance eyewear" },
  { name: "John Jacobs", description: "Modern minimalist eyewear" },
  { name: "Vincent Chase", description: "Trendy affordable eyewear" },
  { name: "Dolce & Gabbana", description: "Luxury Italian eyewear" },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@spexxo.com",
      password: "admin123",
      role: "admin",
    });
    // console.log("Admin user created: admin@spexxo.com / admin123");

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    // console.log("Categories created");

    // Create brands
    const createdBrands = await Brand.insertMany(brands);
    // console.log("Brands created");

    // console.log("Database seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();
