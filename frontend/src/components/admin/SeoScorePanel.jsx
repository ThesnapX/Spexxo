// frontend/src/components/admin/SeoScorePanel.jsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const scoreColor = (score) => {
  if (score >= 80)
    return { bg: "bg-green-500", text: "text-green-600", label: "Excellent" };
  if (score >= 60)
    return { bg: "bg-blue-500", text: "text-blue-600", label: "Good" };
  if (score >= 40)
    return { bg: "bg-yellow-500", text: "text-yellow-600", label: "Fair" };
  if (score >= 20)
    return { bg: "bg-orange-500", text: "text-orange-600", label: "Poor" };
  return { bg: "bg-red-500", text: "text-red-600", label: "Very Poor" };
};

/**
 * SeoScorePanel
 * Props:
 *   - blogData: object with title, excerpt, content, seo, featuredImage, category, tags
 *   - live: boolean - if true, compute client-side; if false, fetch from server
 *   - serverSeo: optional server-provided seo object { score, checks }
 */
const SeoScorePanel = ({ blogData, live = false, serverSeo = null }) => {
  const [showChecks, setShowChecks] = useState(true);

  // Live client-side calculation fallback (mirrors backend logic)
  const computeLive = (blog) => {
    const checks = [];

    const titleLen = blog.title?.trim().length || 0;
    checks.push({
      id: "title-length",
      label:
        titleLen >= 30 && titleLen <= 60
          ? "Title length is optimal (30-60)"
          : `Title length is ${titleLen} chars (aim 30-60)`,
      points: 10,
      passed: titleLen >= 30 && titleLen <= 60,
    });
    checks.push({
      id: "meta-title",
      label: blog.seo?.metaTitle ? "Meta title set" : "Meta title missing",
      points: 10,
      passed: !!blog.seo?.metaTitle,
    });

    const excerptLen = blog.excerpt?.trim().length || 0;
    checks.push({
      id: "excerpt-length",
      label:
        excerptLen >= 100 && excerptLen <= 300
          ? "Excerpt length is good (100-300)"
          : `Excerpt is ${excerptLen} chars (aim 100-300)`,
      points: 8,
      passed: excerptLen >= 100 && excerptLen <= 300,
    });

    const metaDescLen = blog.seo?.metaDescription?.trim().length || 0;
    checks.push({
      id: "meta-desc",
      label:
        metaDescLen >= 120 && metaDescLen <= 160
          ? "Meta description is optimal (120-160)"
          : `Meta description is ${metaDescLen} chars (aim 120-160)`,
      points: 7,
      passed: metaDescLen >= 120 && metaDescLen <= 160,
    });

    const contentLen = blog.content?.replace(/<[^>]*>/g, "").trim().length || 0;
    checks.push({
      id: "content-length",
      label:
        contentLen >= 800
          ? "Content is comprehensive"
          : `Content is ${contentLen} chars (aim 800+)`,
      points: 15,
      passed: contentLen >= 800,
    });
    checks.push({
      id: "headings",
      label: /<h[1-6][^>]*>/i.test(blog.content || "")
        ? "Content has headings"
        : "Add headings to structure content",
      points: 8,
      passed: /<h[1-6][^>]*>/i.test(blog.content || ""),
    });
    checks.push({
      id: "lists",
      label: /<(ul|ol)[^>]*>/i.test(blog.content || "")
        ? "Content has lists"
        : "Add bullet/numbered lists",
      points: 7,
      passed: /<(ul|ol)[^>]*>/i.test(blog.content || ""),
    });

    checks.push({
      id: "featured-image",
      label: blog.featuredImage?.url
        ? "Featured image is set"
        : "Featured image missing",
      points: 8,
      passed: !!blog.featuredImage?.url,
    });
    checks.push({
      id: "image-alt",
      label: blog.featuredImage?.alt
        ? "Image alt text set"
        : "Image alt text missing",
      points: 7,
      passed: !!(blog.featuredImage?.alt && blog.featuredImage.alt.trim()),
    });

    checks.push({
      id: "category",
      label: blog.category ? "Category selected" : "Category not selected",
      points: 8,
      passed: !!blog.category,
    });

    const tagCount = Array.isArray(blog.tags) ? blog.tags.length : 0;
    checks.push({
      id: "tags",
      label: tagCount >= 2 ? "2+ tags added" : "Add at least 2 tags",
      points: 7,
      passed: tagCount >= 2,
    });

    checks.push({
      id: "keywords",
      label: blog.seo?.metaKeywords
        ? "Meta keywords set"
        : "Meta keywords missing",
      points: 5,
      passed: !!blog.seo?.metaKeywords,
    });

    const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
    return { score, checks };
  };

  let seo = serverSeo;
  if (live) {
    seo = computeLive(blogData || {});
  }

  if (!seo) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-sm text-text-light">Loading SEO score...</p>
      </div>
    );
  }

  const { score, checks } = seo;
  const colors = scoreColor(score);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text text-sm">SEO Score</h3>
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${colors.bg} text-white`}
          >
            {colors.label}
          </span>
        </div>

        {/* Score Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${colors.bg}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`text-lg font-bold ${colors.text}`}>{score}</span>
          <span className="text-xs text-text-light">/100</span>
        </div>
      </div>

      {/* Checklist toggle */}
      <button
        onClick={() => setShowChecks(!showChecks)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition text-xs font-medium text-text-light"
      >
        <span>
          SEO Checklist ({checks.filter((c) => c.passed).length}/{checks.length}{" "}
          passed)
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${showChecks ? "rotate-180" : ""}`}
        />
      </button>

      {showChecks && (
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                check.passed ? "bg-green-50" : "bg-red-50"
              }`}
            >
              {check.passed ? (
                <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span
                  className={check.passed ? "text-green-700" : "text-red-700"}
                >
                  {check.label}
                </span>
                <span className="text-text-light ml-1">
                  ({check.points} pts)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoScorePanel;
