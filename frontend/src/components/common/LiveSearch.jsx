import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LiveSearch = ({
  className = "",
  placeholder = "Search eyewear...",
  mobile = false,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Live search query - debounced
  const { data, isLoading } = useQuery({
    queryKey: ["live-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return { products: [] };
      const { data } = await axios.get(
        `${API_URL}/products?search=${query}&limit=5`,
      );
      return data;
    },
    enabled: query.length >= 2,
  });

  const products = data?.products || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    if (query.length >= 2) setIsOpen(true);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
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
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full pl-5 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
            isOpen ? "rounded-b-none rounded-t-2xl border-b-0" : ""
          }`}
          autoComplete="off"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="bg-primary text-white p-1.5 rounded-full hover:bg-primary-dark transition"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-2xl shadow-xl z-50 max-h-[500px] overflow-y-auto">
          {/* Loading */}
          {isLoading && query.length >= 2 && (
            <div className="p-4 text-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-text-light mt-2">Searching...</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && query.length >= 2 && products.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-xs text-text-light font-medium uppercase tracking-wider">
                Products ({data?.pagination?.total || products.length})
              </p>
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition"
                >
                  <img
                    src={
                      product.images?.[0]?.url || "https://picsum.photos/60/60"
                    }
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text line-clamp-1">
                      {highlightMatch(product.name, query)}
                    </p>
                    <p className="text-xs text-text-light">
                      {product.brand?.name || "Spexxo"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-text">
                      ₹
                      {(
                        product.comparePrice || product.price
                      )?.toLocaleString()}
                    </p>
                    {product.comparePrice && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{product.price?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}

              {/* See all results */}
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-2.5 text-center text-sm text-primary font-medium hover:bg-primary/5 transition border-t"
              >
                See all results for "{query}" →
              </button>
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && products.length === 0 && (
            <div className="p-6 text-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-text-light">
                No products found for "{query}"
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

export default LiveSearch;
