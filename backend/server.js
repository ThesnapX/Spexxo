// backend/server.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import popupRoutes from "./routes/popupRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import buildSitemapXml from "./utils/sitemapGenerator.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import shapeRoutes from "./routes/shapeRoutes.js";
import colorRoutes from "./routes/colorRoutes.js";
import lensTypeRoutes from "./routes/lensTypeRoutes.js";
import frameMaterialRoutes from "./routes/frameMaterialRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import subscriberRoutes from "./routes/subscriberRoutes.js";
import { startCronJobs } from "./utils/cronJobs.js";
import adminCronRoutes from "./routes/adminCronRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

// ============ CORS ============
const rawOrigins = process.env.ALLOWED_ORIGINS || "";
const parsedOrigins = rawOrigins
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  parsedOrigins.push(process.env.FRONTEND_URL.trim());
}

// Localhost is only allowed in non-production.
if (!isProduction) {
  parsedOrigins.push("http://localhost:5173");
  parsedOrigins.push("http://localhost:3000");
}

// Deduplicate.
const allowedOrigins = [...new Set(parsedOrigins)];

// Fail loudly in production if no origins configured.
if (isProduction && allowedOrigins.length === 0) {
  console.error(
    "❌ FATAL: No CORS origins configured. Set ALLOWED_ORIGINS or FRONTEND_URL in production.",
  );
  // We do not throw — the app still boots and other endpoints work,
  // but every browser request will be rejected with the log below.
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server / curl (no Origin header).
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("[CORS] Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// ============ SECURITY HEADERS ============
// Minimal, non-breaking. Frontend already sets these via Vercel.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ============ MIDDLEWARE ============
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============ RATE LIMITING ============
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 500 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  skip: (req) => !isProduction && (req.ip === "::1" || req.ip === "127.0.0.1"),
});
app.use("/api/", limiter);

const productsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 120 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many product requests, please slow down.",
  },
  skip: (req) => !isProduction && (req.ip === "::1" || req.ip === "127.0.0.1"),
});
app.use("/api/products", productsLimiter);

// ============ ROUTES ============
console.log("✅ Registering routes...");
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/popups", popupRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/shapes", shapeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/lens-types", lensTypeRoutes);
app.use("/api/frame-materials", frameMaterialRoutes);
app.use("/api/pincode", pincodeRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/admin/cron", adminCronRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/analytics", analyticsRoutes);

console.log("✅ All routes registered");

// ============ SITEMAP ============
app.get("/api/sitemap.xml", async (req, res) => {
  try {
    const xml = await buildSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600");
    res.status(200).send(xml);
  } catch (error) {
    console.error("[SITEMAP] generation error:", error.message);
    res.status(500).json({ success: false, message: "Sitemap unavailable" });
  }
});

// ============ HEALTH ============
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Spexxo API is running",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ============ 404 ============
app.use((req, res) => {
  // Avoid noisy logs for favicon.ico and other benign hits.
  if (
    req.url !== "/favicon.ico" &&
    req.url !== "/robots.txt" &&
    req.url !== "/.well-known/"
  ) {
    console.log("404 - Route not found:", req.method, req.url);
  }
  res.status(404).json({ success: false, message: "Route not found" });
});

// ============ ERROR HANDLING ============
// MUST come after all routes and the 404 handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Log full details server-side, but never send to the client.
  console.error("[ERROR]", {
    method: req.method,
    url: req.url,
    status,
    message: err.message,
    // Include stack only in non-production.
    stack: !isProduction ? err.stack : undefined,
  });

  // Special case: CORS rejection.
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Request origin not allowed",
    });
  }

  // Do not leak internals to the client.
  const safeMessage =
    isProduction && status >= 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(status).json({ success: false, message: safeMessage });
});

// ============ DB ============
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ FATAL: MONGODB_URI is not set.");
}

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: "majority",
    };
    await mongoose.connect(MONGODB_URI, options);
    console.log("✅ MongoDB Connected Successfully");
    console.log("Database:", mongoose.connection.db.databaseName);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("⚠️ Server will continue running without database.");
  }
};

connectDB();
startCronJobs();

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});
mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error:", err.message);
});
mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// ============ START ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🗺️  Sitemap XML: http://localhost:${PORT}/api/sitemap.xml`);
  console.log(`🔗 Allowed origins:`, allowedOrigins.join(", ") || "(none)");
});
