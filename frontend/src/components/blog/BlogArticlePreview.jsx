// frontend/src/components/blog/BlogArticlePreview.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import BlogBlockRenderer, { buildToc } from "./BlogBlockRenderer";

const BlogArticlePreview = ({
  blog,
  blocks,
  relatedBlogs = [],
  sidebarProducts = [],
  isPreviewMode = false,
}) => {
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const tocItems = buildToc(blocks, [2, 3, 4]);

  const scrollToId = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        history.replaceState(null, "", `#${id}`);
      } catch {}
    }
  };

  const LinkWrap = ({ to, className, children, ...rest }) => {
    if (isPreviewMode) {
      return (
        <span className={className} {...rest}>
          {children}
        </span>
      );
    }
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    );
  };

  return (
    <div className="pb-16 bg-white">
      <div className="max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-light mb-6 flex-wrap">
          <LinkWrap to="/" className="hover:text-primary transition">
            Home
          </LinkWrap>
          <ChevronRightIcon className="w-3.5 h-3.5" />
          <LinkWrap to="/blog" className="hover:text-primary transition">
            Blogs
          </LinkWrap>
          {blog.category?.name && (
            <>
              <ChevronRightIcon className="w-3.5 h-3.5" />
              <span className="text-text">{blog.category.name}</span>
            </>
          )}
        </nav>

        {/*
          Two-column grid.
          - `items-start` makes each grid cell align to the top, so the aside
            is content-sized (not stretched to the row height).
          - No ancestor has overflow set, so `sticky` on the aside sticks to
            the viewport scroll — which is what we want.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-10 items-start">
          {/* ── MAIN ARTICLE ── */}
          <article className="min-w-0">
            <header className="mb-8">
              {blog.category?.name && (
                <span className="inline-block text-[11px] font-medium tracking-wider uppercase text-primary bg-[#EBF4FC] px-3 py-1 rounded-full mb-4">
                  {blog.category.name}
                </span>
              )}
              <h1 className="text-[26px] md:text-[32px] lg:text-[38px] leading-tight font-bold text-text mb-4">
                {blog.title || "Untitled Blog"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-light">
                {blog.author && (
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" />
                    {blog.author}
                  </span>
                )}
                {(blog.publishedAt || blog.createdAt) && (
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(
                      blog.publishedAt || blog.createdAt || Date.now(),
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                {blog.readTime && (
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4" />
                    {blog.readTime} min read
                  </span>
                )}
              </div>
            </header>

            {/* Cover image — fixed 16:9 */}
            {blog.featuredImage?.url && (
              <div className="mb-8 rounded-2xl overflow-hidden bg-gray-100 aspect-[16/9]">
                <img
                  src={blog.featuredImage.url}
                  alt={blog.featuredImage.alt || blog.title}
                  className="w-full h-full object-cover"
                  fetchpriority="high"
                />
              </div>
            )}

            {/* Mobile TOC */}
            {tocItems.length > 0 && (
              <div className="lg:hidden mb-8 rounded-xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-text"
                >
                  <span>Table of Contents</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition ${
                      mobileTocOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileTocOpen && (
                  <nav className="p-4">
                    <ol className="space-y-2" style={{ listStyle: "none" }}>
                      {tocItems.map((item, i) => (
                        <li
                          key={item.id}
                          style={{ paddingLeft: (item.level - 2) * 14 }}
                        >
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => scrollToId(e, item.id)}
                            className="text-sm text-text-light hover:text-primary flex gap-2"
                          >
                            <span className="text-primary font-medium tabular-nums shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{item.text}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
              </div>
            )}

            {/* Article content */}
            <div className="blog-article">
              <BlogBlockRenderer blocks={blocks} />
            </div>

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                {blog.tags.map((t) => {
                  const tagSlug = typeof t === "object" ? t.slug : t;
                  const tagName = typeof t === "object" ? t.name : t;
                  return (
                    <LinkWrap
                      key={t._id || t}
                      to={`/blog?tag=${tagSlug}`}
                      className="px-3 py-1 bg-[#EBF4FC] text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition"
                    >
                      #{tagName}
                    </LinkWrap>
                  );
                })}
              </div>
            )}
          </article>

          {/*
            ── SIDEBAR ──
            - `sticky top-24` sticks 96px below the viewport top.
            - `self-start` shrinks the aside to its content height so sticky
              has room to move within the grid row.
            - `max-h-[calc(100vh-7rem)]` + `overflow-y-auto` lets the sidebar
              scroll internally on short screens without breaking sticky:
              overflow is scoped to the aside itself, not to any ancestor.
            - On lg- we hide it entirely; mobile uses the collapsible TOC.
          */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="space-y-6 pb-2">
              {/* Desktop TOC */}
              {tocItems.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-sm font-semibold text-text mb-3">
                    Table of Contents
                  </p>
                  <ol
                    className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1"
                    style={{ listStyle: "none" }}
                  >
                    {tocItems.map((item, i) => (
                      <li
                        key={item.id}
                        style={{ paddingLeft: (item.level - 2) * 12 }}
                      >
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => scrollToId(e, item.id)}
                          className="text-sm text-text-light hover:text-primary flex gap-2 leading-snug"
                        >
                          <span className="text-primary font-medium tabular-nums shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{item.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Related blogs */}
              {relatedBlogs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="text-sm font-semibold text-text mb-4">
                    Related Articles
                  </p>
                  <div className="space-y-4">
                    {relatedBlogs.slice(0, 3).map((rb) => (
                      <LinkWrap
                        key={rb._id}
                        to={`/blog/${rb.slug}`}
                        className="group flex gap-3 items-start"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {rb.featuredImage?.url ? (
                            <img
                              src={rb.featuredImage.url}
                              alt={rb.title}
                              loading="lazy"
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              📝
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text line-clamp-2 group-hover:text-primary transition leading-snug">
                            {rb.title}
                          </p>
                          {rb.readTime && (
                            <p className="text-[11px] text-text-light mt-1">
                              {rb.readTime} min read
                            </p>
                          )}
                        </div>
                      </LinkWrap>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended products */}
              {sidebarProducts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <p className="text-sm font-semibold text-text mb-4">
                    Recommended For You
                  </p>
                  <div className="space-y-4">
                    {sidebarProducts.slice(0, 3).map((p) => (
                      <LinkWrap
                        key={p._id}
                        to={`/product/${p.slug}`}
                        className="group flex gap-3 items-center"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {p.images?.[0]?.url ? (
                            <img
                              src={p.images[0].url}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                              👓
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text line-clamp-2 leading-snug group-hover:text-primary transition">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-text">
                              ₹{(p.comparePrice || p.price)?.toLocaleString?.()}
                            </span>
                            {p.comparePrice && p.price > p.comparePrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{p.price?.toLocaleString?.()}
                              </span>
                            )}
                          </div>
                        </div>
                      </LinkWrap>
                    ))}
                  </div>
                  <LinkWrap
                    to="/shop"
                    className="block text-center text-sm text-primary hover:underline mt-5"
                  >
                    Browse All Eyewear →
                  </LinkWrap>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogArticlePreview;
