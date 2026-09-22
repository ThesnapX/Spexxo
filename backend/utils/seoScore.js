// backend/utils/seoScore.js

/**
 * Calculate SEO score for a blog (0-100)
 * Each check has a weight; total weight sums to 100
 */

export const calculateBlogSeoScore = (blog) => {
  const checks = [];

  // ===== TITLE CHECKS (20 points) =====
  const titleLen = blog.title?.trim().length || 0;
  if (titleLen >= 30 && titleLen <= 60) {
    checks.push({
      id: "title-length",
      label: "Title length is optimal (30-60)",
      points: 10,
      passed: true,
    });
  } else if (titleLen > 0) {
    checks.push({
      id: "title-length",
      label: `Title length is ${titleLen} chars (aim 30-60)`,
      points: 10,
      passed: false,
    });
  } else {
    checks.push({
      id: "title-length",
      label: "Title is missing",
      points: 10,
      passed: false,
    });
  }

  if (blog.seo?.metaTitle && blog.seo.metaTitle.trim().length > 0) {
    checks.push({
      id: "meta-title",
      label: "Meta title set",
      points: 10,
      passed: true,
    });
  } else {
    checks.push({
      id: "meta-title",
      label: "Meta title missing",
      points: 10,
      passed: false,
    });
  }

  // ===== DESCRIPTION CHECKS (15 points) =====
  const excerptLen = blog.excerpt?.trim().length || 0;
  if (excerptLen >= 100 && excerptLen <= 300) {
    checks.push({
      id: "excerpt-length",
      label: "Excerpt length is good (100-300)",
      points: 8,
      passed: true,
    });
  } else {
    checks.push({
      id: "excerpt-length",
      label: `Excerpt is ${excerptLen} chars (aim 100-300)`,
      points: 8,
      passed: false,
    });
  }

  const metaDescLen = blog.seo?.metaDescription?.trim().length || 0;
  if (metaDescLen >= 120 && metaDescLen <= 160) {
    checks.push({
      id: "meta-desc",
      label: "Meta description is optimal (120-160)",
      points: 7,
      passed: true,
    });
  } else {
    checks.push({
      id: "meta-desc",
      label: `Meta description is ${metaDescLen} chars (aim 120-160)`,
      points: 7,
      passed: false,
    });
  }

  // ===== CONTENT CHECKS (30 points) =====
  const contentLen = blog.content?.replace(/<[^>]*>/g, "").trim().length || 0;
  if (contentLen >= 800) {
    checks.push({
      id: "content-length",
      label: "Content is comprehensive (800+ words)",
      points: 15,
      passed: true,
    });
  } else if (contentLen >= 300) {
    checks.push({
      id: "content-length",
      label: `Content is ${contentLen} chars (aim 800+)`,
      points: 15,
      passed: false,
    });
  } else {
    checks.push({
      id: "content-length",
      label: "Content is too short",
      points: 15,
      passed: false,
    });
  }

  const hasHeadings = /<h[1-6][^>]*>/i.test(blog.content || "");
  if (hasHeadings) {
    checks.push({
      id: "headings",
      label: "Content has headings (H1-H6)",
      points: 8,
      passed: true,
    });
  } else {
    checks.push({
      id: "headings",
      label: "Add headings to structure content",
      points: 8,
      passed: false,
    });
  }

  const hasLists = /<(ul|ol)[^>]*>/i.test(blog.content || "");
  if (hasLists) {
    checks.push({
      id: "lists",
      label: "Content has lists",
      points: 7,
      passed: true,
    });
  } else {
    checks.push({
      id: "lists",
      label: "Add bullet/numbered lists",
      points: 7,
      passed: false,
    });
  }

  // ===== MEDIA CHECKS (15 points) =====
  if (blog.featuredImage?.url) {
    checks.push({
      id: "featured-image",
      label: "Featured image is set",
      points: 8,
      passed: true,
    });
  } else {
    checks.push({
      id: "featured-image",
      label: "Featured image missing",
      points: 8,
      passed: false,
    });
  }

  if (blog.featuredImage?.alt && blog.featuredImage.alt.trim()) {
    checks.push({
      id: "image-alt",
      label: "Image alt text set",
      points: 7,
      passed: true,
    });
  } else {
    checks.push({
      id: "image-alt",
      label: "Image alt text missing",
      points: 7,
      passed: false,
    });
  }

  // ===== TAXONOMY CHECKS (15 points) =====
  if (blog.category) {
    checks.push({
      id: "category",
      label: "Category selected",
      points: 8,
      passed: true,
    });
  } else {
    checks.push({
      id: "category",
      label: "Category not selected",
      points: 8,
      passed: false,
    });
  }

  if (blog.tags && blog.tags.length >= 2) {
    checks.push({
      id: "tags",
      label: "2+ tags added",
      points: 7,
      passed: true,
    });
  } else {
    checks.push({
      id: "tags",
      label: "Add at least 2 tags",
      points: 7,
      passed: false,
    });
  }

  // ===== KEYWORDS CHECK (5 points) =====
  if (blog.seo?.metaKeywords && blog.seo.metaKeywords.trim().length > 0) {
    checks.push({
      id: "keywords",
      label: "Meta keywords set",
      points: 5,
      passed: true,
    });
  } else {
    checks.push({
      id: "keywords",
      label: "Meta keywords missing",
      points: 5,
      passed: false,
    });
  }

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);

  return { score, checks };
};

/**
 * Get a label + color for the score
 */
export const getSeoScoreLabel = (score) => {
  if (score >= 80) return { label: "Excellent", color: "green" };
  if (score >= 60) return { label: "Good", color: "blue" };
  if (score >= 40) return { label: "Fair", color: "yellow" };
  if (score >= 20) return { label: "Poor", color: "orange" };
  return { label: "Very Poor", color: "red" };
};
