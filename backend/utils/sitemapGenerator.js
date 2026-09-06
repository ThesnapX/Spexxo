// backend/utils/sitemapGenerator.js

import Product from "../models/Product.js";
import Blog from "../models/Blog.js";
import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSitemap = async () => {
  // ✅ FIX: Use the correct domain
  // For Vercel deployment, use the Vercel URL
  // For custom domain, use the custom domain
  const baseUrl =
    process.env.SITEMAP_BASE_URL ||
    process.env.FRONTEND_URL ||
    "https://spexxo.vercel.app";

  console.log(`[SITEMAP] Generating sitemap for: ${baseUrl}`);

  // Static pages
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/shop", priority: "0.9", changefreq: "daily" },
    { url: "/shop/eyeglasses", priority: "0.8", changefreq: "daily" },
    { url: "/shop/sunglasses", priority: "0.8", changefreq: "daily" },
    { url: "/shop/contact-lens", priority: "0.8", changefreq: "daily" },
    { url: "/blog", priority: "0.7", changefreq: "weekly" },
    { url: "/about", priority: "0.5", changefreq: "monthly" },
    { url: "/contact", priority: "0.5", changefreq: "monthly" },
    { url: "/faq", priority: "0.4", changefreq: "monthly" },
    { url: "/privacy", priority: "0.3", changefreq: "yearly" },
    { url: "/terms", priority: "0.3", changefreq: "yearly" },
    { url: "/shipping", priority: "0.3", changefreq: "yearly" },
    { url: "/refund", priority: "0.3", changefreq: "yearly" },
  ];

  // Get dynamic pages
  let products = [];
  let blogs = [];
  let categories = [];

  try {
    products = await Product.find({ isActive: true })
      .select("slug updatedAt")
      .lean();
    blogs = await Blog.find({ status: "published" })
      .select("slug updatedAt")
      .lean();
    categories = await Category.find({ isActive: true })
      .select("slug updatedAt")
      .lean();
  } catch (error) {
    console.error("[SITEMAP] Error fetching data:", error.message);
  }

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
  sitemap += `  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

  // Static pages
  staticPages.forEach((page) => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemap += `  </url>\n`;
  });

  // Product pages (limit to 1000 for performance)
  const productLimit = 1000;
  const productsToInclude = products.slice(0, productLimit);

  productsToInclude.forEach((product) => {
    if (!product.slug) return;
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/product/${product.slug}</loc>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    if (product.updatedAt) {
      sitemap += `    <lastmod>${new Date(product.updatedAt).toISOString()}</lastmod>\n`;
    }
    sitemap += `  </url>\n`;
  });

  // Blog pages
  blogs.forEach((blog) => {
    if (!blog.slug) return;
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/blog/${blog.slug}</loc>\n`;
    sitemap += `    <priority>0.6</priority>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    if (blog.updatedAt) {
      sitemap += `    <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>\n`;
    }
    sitemap += `  </url>\n`;
  });

  // Category pages
  categories.forEach((category) => {
    if (!category.slug) return;
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/shop?category=${category.slug}</loc>\n`;
    sitemap += `    <priority>0.7</priority>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    if (category.updatedAt) {
      sitemap += `    <lastmod>${new Date(category.updatedAt).toISOString()}</lastmod>\n`;
    }
    sitemap += `  </url>\n`;
  });

  sitemap += `</urlset>`;

  // Write to frontend public folder
  const publicPath = path.join(__dirname, "../../frontend/public/sitemap.xml");
  const fallbackPath = path.join(__dirname, "../public/sitemap.xml");

  try {
    // Try to write to frontend first
    fs.writeFileSync(publicPath, sitemap);
    console.log(`[SITEMAP] ✅ Sitemap generated at: ${publicPath}`);
    console.log(`[SITEMAP] 📍 Base URL: ${baseUrl}`);
    console.log(
      `[SITEMAP] 📊 Pages included: ${staticPages.length + productsToInclude.length + blogs.length + categories.length}`,
    );
  } catch (error) {
    console.error(`[SITEMAP] Error writing to frontend folder:`, error.message);
    // Try fallback location
    try {
      fs.writeFileSync(fallbackPath, sitemap);
      console.log(
        `[SITEMAP] ✅ Sitemap generated at fallback: ${fallbackPath}`,
      );
    } catch (fallbackError) {
      console.error(
        `[SITEMAP] ❌ Failed to write sitemap:`,
        fallbackError.message,
      );
    }
  }
};

export default generateSitemap;
