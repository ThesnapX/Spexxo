import Product from "../models/Product.js";
import Blog from "../models/Blog.js";
import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSitemap = async () => {
  const baseUrl = process.env.FRONTEND_URL || "https://spexxo.com";

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
  ];

  // Get dynamic pages
  const products = await Product.find({ isActive: true }).select(
    "slug updatedAt",
  );
  const blogs = await Blog.find({ status: "published" }).select(
    "slug updatedAt",
  );
  const categories = await Category.find({ isActive: true }).select(
    "slug updatedAt",
  );

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

  // Product pages
  products.forEach((product) => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/product/${product.slug}</loc>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
    sitemap += `  </url>\n`;
  });

  // Blog pages
  blogs.forEach((blog) => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/blog/${blog.slug}</loc>\n`;
    sitemap += `    <priority>0.6</priority>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <lastmod>${blog.updatedAt.toISOString()}</lastmod>\n`;
    sitemap += `  </url>\n`;
  });

  // Category pages
  categories.forEach((category) => {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/shop?category=${category.slug}</loc>\n`;
    sitemap += `    <priority>0.7</priority>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <lastmod>${category.updatedAt.toISOString()}</lastmod>\n`;
    sitemap += `  </url>\n`;
  });

  sitemap += `</urlset>`;

  // Write to public folder
  const publicPath = path.join(__dirname, "../../frontend/public/sitemap.xml");
  fs.writeFileSync(publicPath, sitemap);
  // console.log("Sitemap generated successfully!");
};

export default generateSitemap;
