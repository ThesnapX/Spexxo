// backend/utils/sitemapGenerator.js
//
// Deterministic sitemap generation.
//
// Production strategy for Vercel:
//   Run `node backend/utils/sitemapGenerator.js --write` locally with a
//   production MONGODB_URI, which regenerates frontend/public/sitemap.xml.
//   Commit the resulting file. Vercel serves frontend/public as static.

import Product from "../models/Product.js";
import Blog from "../models/Blog.js";
import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SITE_URL_FINAL } from "./siteUrl.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Env-driven base URL — falls back to the shared siteUrl resolver.
const BASE_URL = process.env.SITEMAP_BASE_URL || SITE_URL_FINAL;

const escapeXml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Canonical static pages (matches frontend routes exactly).
const STATIC_PAGES = [
  { url: "/" },
  { url: "/shop" },
  { url: "/shop/eyeglasses" },
  { url: "/shop/sunglasses" },
  { url: "/shop/contact-lens" },
  { url: "/blog" },
  { url: "/about" },
  { url: "/contact" },
  { url: "/faq" },
  { url: "/privacy" },
  { url: "/terms" },
  { url: "/shipping" },
  { url: "/refund" },
];

/**
 * Builds the XML string.
 */
export const buildSitemapXml = async () => {
  let products = [];
  let blogs = [];
  let categories = [];

  try {
    products = await Product.find({
      isActive: true,
      slug: { $exists: true, $ne: null, $ne: "" },
    })
      .select("slug updatedAt")
      .lean();
  } catch (e) {
    console.error("[SITEMAP] products fetch error:", e.message);
  }

  try {
    blogs = await Blog.find({
      status: "published",
      slug: { $exists: true, $ne: null, $ne: "" },
    })
      .select("slug updatedAt")
      .lean();
  } catch (e) {
    console.error("[SITEMAP] blogs fetch error:", e.message);
  }

  const SUPPORTED_SHOP_SLUGS = new Set([
    "eyeglasses",
    "sunglasses",
    "contact-lens",
  ]);

  try {
    categories = await Category.find({
      isActive: true,
      slug: { $exists: true, $ne: null, $ne: "" },
    })
      .select("slug updatedAt")
      .lean();
  } catch (e) {
    console.error("[SITEMAP] categories fetch error:", e.message);
  }

  const urls = [];

  STATIC_PAGES.forEach((p) => {
    urls.push({
      loc: `${BASE_URL}${p.url}`,
      lastmod: new Date().toISOString(),
    });
  });

  categories.forEach((cat) => {
    if (!cat.slug) return;
    if (!SUPPORTED_SHOP_SLUGS.has(cat.slug)) return;
    const loc = `${BASE_URL}/shop/${cat.slug}`;
    if (urls.some((u) => u.loc === loc)) return;
    urls.push({
      loc,
      lastmod: cat.updatedAt
        ? new Date(cat.updatedAt).toISOString()
        : new Date().toISOString(),
    });
  });

  products.forEach((p) => {
    urls.push({
      loc: `${BASE_URL}/product/${p.slug}`,
      lastmod: p.updatedAt
        ? new Date(p.updatedAt).toISOString()
        : new Date().toISOString(),
    });
  });

  blogs.forEach((b) => {
    urls.push({
      loc: `${BASE_URL}/blog/${b.slug}`,
      lastmod: b.updatedAt
        ? new Date(b.updatedAt).toISOString()
        : new Date().toISOString(),
    });
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  urls.forEach((u) => {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(u.loc)}</loc>\n`;
    xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  return xml;
};

/**
 * Local-only helper. Writes the sitemap to frontend/public/sitemap.xml.
 * Do NOT call this from server.js on Vercel.
 */
const writeSitemapToFrontendPublic = async () => {
  const xml = await buildSitemapXml();
  const target = path.join(
    __dirname,
    "..",
    "..",
    "frontend",
    "public",
    "sitemap.xml",
  );
  try {
    fs.writeFileSync(target, xml, "utf-8");
    console.log(`[SITEMAP] Written to: ${target}`);
  } catch (e) {
    console.error("[SITEMAP] write failed:", e.message);
  }
  return xml;
};

// If invoked directly: node utils/sitemapGenerator.js --write
if (
  process.argv[1] &&
  process.argv[1].endsWith("sitemapGenerator.js") &&
  process.argv.includes("--write")
) {
  (async () => {
    const mongoose = (await import("mongoose")).default;
    const dotenv = (await import("dotenv")).default;
    dotenv.config();
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await writeSitemapToFrontendPublic();
      await mongoose.disconnect();
      process.exit(0);
    } catch (e) {
      console.error("[SITEMAP] script error:", e.message);
      process.exit(1);
    }
  })();
}

export default buildSitemapXml;
