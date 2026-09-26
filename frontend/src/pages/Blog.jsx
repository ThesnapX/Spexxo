// frontend/src/pages/Blog.jsx

import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import SEO from "../components/common/SEO";
import BlogLiveSearch from "../components/common/BlogLiveSearch";
import { ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SITE_URL = "https://spexxo.vercel.app";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const searchTerm = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";

  // Internal-search pages should not be indexed
  const isSearchPage = !!(searchTerm || tag);

  const { data, isLoading } = useQuery({
    queryKey: ["blogs", category, searchTerm, tag],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: 12 });
      if (category) params.set("category", category);
      if (searchTerm) params.set("search", searchTerm);
      if (tag) params.set("tag", tag);
      const { data } = await axios.get(`${API_URL}/blogs?${params}`);
      return data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["blog-categories-public"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/blogs/categories`);
      return data.categories || [];
    },
  });

  const blogs = data?.blogs || [];
  const categories = categoriesData || [];

  const setCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("category", slug);
    else params.delete("category");
    params.delete("search");
    params.delete("tag");
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("tag");
    setSearchParams(params);
  };

  return (
    <>
      <SEO
        title={
          category
            ? `${category.charAt(0).toUpperCase() + category.slice(1)} — Eyewear Blog`
            : "Eye Care Blog — Tips, Guides & Eyewear Trends"
        }
        description={
          category
            ? `Read articles about ${category} on the Spexxo blog. Eye care tips, buying guides and eyewear trends.`
            : "Eye care tips, buying guides and eyewear trends from the Spexxo team. Learn how to choose the right eyeglasses, sunglasses and contact lenses."
        }
        // ✅ Canonical collapses to /blog. Category-tagged browse is
        // supplementary and shouldn't produce a new canonical URL,
        // unless you later create dedicated /blog/category/:slug routes.
        canonicalUrl={`${SITE_URL}/blog`}
        noIndex={isSearchPage}
        ogType="website"
        breadcrumbs={[
          { name: "Home", item: `${SITE_URL}/` },
          { name: "Blog", item: `${SITE_URL}/blog` },
        ]}
      />

      <div className="pt-28 pb-16">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-text mb-2">Eye Care Blog</h1>
            <p className="text-text-light">
              Tips, guides & latest trends in eyewear
            </p>
          </div>

          <div className="max-w-xl mx-auto mb-6">
            <BlogLiveSearch initialValue={searchTerm} />
          </div>

          {(searchTerm || tag) && (
            <div className="max-w-xl mx-auto mb-6 flex items-center justify-center gap-2 text-sm text-text-light">
              <span>
                {searchTerm && (
                  <>
                    Results for{" "}
                    <strong className="text-text">"{searchTerm}"</strong>
                  </>
                )}
                {tag && (
                  <>
                    {searchTerm ? " · " : "Tagged "}
                    <strong className="text-text">#{tag}</strong>
                  </>
                )}
              </span>
              <button
                onClick={clearSearch}
                className="text-primary hover:underline text-xs"
              >
                Clear
              </button>
            </div>
          )}

          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setCategory("")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  !category
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-light hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setCategory(cat.slug)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    category === cat.slug
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-text-light hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-56 bg-gray-200 rounded-2xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-6xl mb-4">📝</p>
              <h2 className="text-xl font-semibold text-text mb-2">
                {searchTerm || tag ? "No Posts Found" : "No Blog Posts Yet"}
              </h2>
              <p className="text-text-light">
                {searchTerm || tag
                  ? "Try adjusting your search or filters"
                  : "Check back later for eye care tips and guides"}
              </p>
              {(searchTerm || tag) && (
                <button
                  onClick={clearSearch}
                  className="btn-outline text-sm mt-6"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blog/${blog.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    {blog.featuredImage?.url ? (
                      <img
                        src={blog.featuredImage.url}
                        alt={blog.featuredImage.alt || blog.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📝
                      </div>
                    )}
                    {blog.category && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-medium px-3 py-1 rounded-full">
                        {blog.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-xs text-text-light mb-2">
                      <span>
                        {new Date(
                          blog.publishedAt || blog.createdAt,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {blog.readTime && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" /> {blog.readTime} min
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-primary transition line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-text-light text-sm line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Blog;
