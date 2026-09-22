// frontend/src/components/common/BlogLiveSearch.jsx

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * BlogLiveSearch
 *
 * Live blog search with a dropdown showing real-time results.
 * Similar UX to the header product LiveSearch.
 */
const BlogLiveSearch = ({
  className = "",
  placeholder = "Search blog posts…",
  initialValue = "",
}) => {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce input → debouncedQuery
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch live results when debouncedQuery is 2+ chars
  const { data, isLoading } = useQuery({
    queryKey: ["blog-live-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { blogs: [] };
      const { data } = await axios.get(
        `${API_URL}/blogs?search=${encodeURIComponent(debouncedQuery)}&limit=6`,
      );
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  const blogs = data?.blogs || [];

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (query.trim()) {
      navigate(`/blog?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && blogs.length > 0) {
        // Navigate to first result
        navigate(`/blog/${blogs[0].slug}`);
        setIsOpen(false);
        inputRef.current?.blur();
      } else {
        handleSubmit();
      }
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
  };

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text, term) => {
    if (!term || !text) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-primary font-semibold">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-12 py-3 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
            isOpen ? "rounded-b-none rounded-t-2xl border-b-0" : ""
          }`}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-2xl shadow-xl z-50 max-h-[500px] overflow-y-auto">
          {/* Loading */}
          {isLoading && debouncedQuery.length >= 2 && (
            <div className="p-4 text-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-text-light mt-2">Searching…</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && debouncedQuery.length >= 2 && blogs.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs text-text-light font-medium uppercase tracking-wider">
                Posts ({data?.pagination?.total ?? blogs.length})
              </p>
              {blogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blog/${blog.slug}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {blog.featuredImage?.url ? (
                      <img
                        src={blog.featuredImage.url}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        📝
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text line-clamp-1">
                      {highlightMatch(blog.title, debouncedQuery)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-light mt-0.5">
                      {blog.category?.name && (
                        <span className="bg-[#EBF4FC] text-primary px-2 py-0.5 rounded-full">
                          {blog.category.name}
                        </span>
                      )}
                      {blog.readTime && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {blog.readTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              <button
                onClick={handleSubmit}
                className="w-full px-4 py-2.5 text-center text-sm text-primary font-medium hover:bg-primary/5 transition border-t"
              >
                See all results for "{debouncedQuery}" →
              </button>
            </div>
          )}

          {/* No results */}
          {!isLoading && debouncedQuery.length >= 2 && blogs.length === 0 && (
            <div className="p-6 text-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-text-light">
                No posts found for "{debouncedQuery}"
              </p>
              <p className="text-xs text-text-light mt-1">
                Try different keywords
              </p>
            </div>
          )}

          {/* Short query hint */}
          {query.length > 0 && query.length < 2 && (
            <div className="p-4 text-center">
              <p className="text-xs text-text-light">
                Type at least 2 characters to search
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogLiveSearch;
