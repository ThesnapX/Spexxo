// frontend/src/pages/Shop.jsx

import { useAuth } from "../context/AuthContext";
import AuthPopup from "../components/common/AuthPopup";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  StarIcon,
  HeartIcon,
  ShoppingBagIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import SEO from "../components/common/SEO";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ============================================
// STABLE FILTER SECTION COMPONENT
// ============================================
const FilterSection = ({
  searchInput,
  onSearchChange,
  categorySearch,
  onCategorySearchChange,
  brandSearch,
  onBrandSearchChange,
  categoriesData,
  filteredCategories,
  brandsData,
  filteredBrands,
  categoryFilter,
  setSingleFilter,
  genderFilter,
  toggleArrayFilter,
  priceMinInput,
  priceMaxInput,
  onPriceMinChange,
  onPriceMaxChange,
  brandFilter,
  frameShapeFilter,
  frameShapeOptions,
  lensTypeFilter,
  lensTypeOptions,
  hasActiveFilters,
  clearAllFilters,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Search</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, brand, category, frame shape, material, lens type, color..."
            value={searchInput}
            onChange={onSearchChange}
            className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <p className="text-xs text-text-light mt-1">
          Searches across all product attributes
        </p>
      </div>

      {/* Categories with search */}
      {categoriesData?.length > 0 && (
        <div>
          <h3 className="font-semibold text-text text-sm mb-2">Categories</h3>
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={onCategorySearchChange}
              className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            {categorySearch && (
              <button
                onClick={() =>
                  onCategorySearchChange({ target: { value: "" } })
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            <label
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${!categoryFilter ? "bg-[#EBF4FC]" : "hover:bg-gray-50"}`}
            >
              <input
                type="radio"
                name="category"
                checked={!categoryFilter}
                onChange={() => setSingleFilter("category", "")}
                className="w-4 h-4 text-primary"
              />
              <span
                className={`text-sm ${!categoryFilter ? "text-primary font-medium" : "text-text-light"}`}
              >
                All Categories
              </span>
            </label>
            {filteredCategories.map((cat) => (
              <label
                key={cat._id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${categoryFilter === cat.slug ? "bg-[#EBF4FC]" : "hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="category"
                  checked={categoryFilter === cat.slug}
                  onChange={() => setSingleFilter("category", cat.slug)}
                  className="w-4 h-4 text-primary"
                />
                <span
                  className={`text-sm ${categoryFilter === cat.slug ? "text-primary font-medium" : "text-text-light"}`}
                >
                  {cat.name}
                </span>
              </label>
            ))}
            {filteredCategories.length === 0 && categorySearch && (
              <p className="text-sm text-text-light px-2 py-1">
                No categories found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gender */}
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Gender</h3>
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {["men", "women", "unisex", "kids"].map((opt) => {
            const isChecked = genderFilter.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${isChecked ? "bg-[#EBF4FC]" : "hover:bg-gray-50"}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayFilter("gender", opt)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span
                  className={`text-sm ${isChecked ? "text-primary font-medium" : "text-text-light"}`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceMinInput}
            onChange={onPriceMinChange}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceMaxInput}
            onChange={onPriceMaxChange}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        {priceMinInput &&
          priceMaxInput &&
          Number(priceMinInput) > Number(priceMaxInput) && (
            <p className="text-xs text-red-500 mt-1">
              Min price cannot be greater than Max price
            </p>
          )}
      </div>

      {/* Brands with search */}
      {brandsData?.length > 0 && (
        <div>
          <h3 className="font-semibold text-text text-sm mb-2">Brands</h3>
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={onBrandSearchChange}
              className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            {brandSearch && (
              <button
                onClick={() => onBrandSearchChange({ target: { value: "" } })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {filteredBrands.map((brand) => {
              const isChecked = brandFilter.includes(brand.slug);
              return (
                <label
                  key={brand._id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${isChecked ? "bg-[#EBF4FC]" : "hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayFilter("brand", brand.slug)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span
                    className={`text-sm ${isChecked ? "text-primary font-medium" : "text-text-light"}`}
                  >
                    {brand.name}
                  </span>
                </label>
              );
            })}
            {filteredBrands.length === 0 && brandSearch && (
              <p className="text-sm text-text-light px-2 py-1">
                No brands found
              </p>
            )}
          </div>
        </div>
      )}

      {/* Frame Shape */}
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Frame Shape</h3>
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {frameShapeOptions.map((shape) => {
            const isChecked = frameShapeFilter.includes(shape);
            return (
              <label
                key={shape}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${isChecked ? "bg-[#EBF4FC]" : "hover:bg-gray-50"}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayFilter("frameShape", shape)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span
                  className={`text-sm ${isChecked ? "text-primary font-medium" : "text-text-light"}`}
                >
                  {shape.charAt(0).toUpperCase() +
                    shape.slice(1).replace("-", " ")}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Lens Type */}
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Lens Type</h3>
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {lensTypeOptions.map((lens) => {
            const isChecked = lensTypeFilter.includes(lens);
            return (
              <label
                key={lens}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${isChecked ? "bg-[#EBF4FC]" : "hover:bg-gray-50"}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayFilter("lensType", lens)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span
                  className={`text-sm ${isChecked ? "text-primary font-medium" : "text-text-light"}`}
                >
                  {lens
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg transition text-sm font-medium border border-red-200"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

// ============================================
// STABLE PRODUCT CARD COMPONENT
// ============================================
const ProductCard = ({
  product,
  user,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  setShowAuthPopup,
  getDisplayPrice,
}) => {
  const { displayPrice, originalPrice, hasDiscount, discountPercent } =
    getDisplayPrice(product);
  const hasVariantsFlag = product.variants && product.variants.length > 0;
  const variantCount = hasVariantsFlag ? product.variants.length : 0;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <div className="relative overflow-hidden bg-gray-50 flex-shrink-0">
        <Link to={`/product/${product.slug}`} className="block">
          <img
            src={product.images?.[0]?.url || "https://picsum.photos/400/400"}
            alt={product.name}
            className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {discountPercent}% OFF
          </span>
        )}
        {hasVariantsFlag && (
          <span className="absolute top-3 right-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <span className="text-[10px]">📦</span>
            {variantCount} Variants
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
              setShowAuthPopup(true);
              return;
            }
            isInWishlist(product._id)
              ? removeFromWishlist(product._id)
              : addToWishlist(product._id);
          }}
          className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-all z-10"
        >
          {isInWishlist(product._id) ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        {product.brand?.name && (
          <p className="text-xs text-text-light mb-1 truncate">
            {product.brand.name}
          </p>
        )}
        <Link to={`/product/${product.slug}`} className="block flex-shrink-0">
          <h3 className="font-medium text-sm text-text mb-2 line-clamp-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 flex-wrap mt-auto">
          <span className="font-bold text-text">
            ₹{displayPrice?.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{originalPrice?.toLocaleString()}
            </span>
          )}
          {hasDiscount && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {discountPercent}% off
            </span>
          )}
          {hasVariantsFlag && (
            <span className="text-xs text-purple-500 font-medium">
              ({variantCount} variants)
            </span>
          )}
        </div>

        {hasVariantsFlag ? (
          <Link
            to={`/product/${product.slug}`}
            className="w-full mt-3 py-2 bg-purple-500/10 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-500 hover:text-white transition flex items-center justify-center gap-2"
          >
            <EyeIcon className="w-4 h-4" /> View Product
          </Link>
        ) : (
          <button
            onClick={() => {
              addToCart(product._id, 1);
            }}
            className="w-full mt-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition flex items-center justify-center gap-2"
          >
            <ShoppingBagIcon className="w-4 h-4" /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN SHOP COMPONENT
// ============================================
const Shop = () => {
  const { category: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { user } = useAuth();
  const loadMoreRef = useRef(null);
  const productsContainerRef = useRef(null);

  // ✅ Track if user is currently typing to prevent URL overwrites
  const isTypingRef = useRef({
    search: false,
    priceMin: false,
    priceMax: false,
  });

  // Search states for filters
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  // LOCAL STATE for inputs - updates immediately on typing
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [priceMinInput, setPriceMinInput] = useState(
    searchParams.get("minPrice") || "",
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    searchParams.get("maxPrice") || "",
  );

  // Debounce refs
  const searchTimeout = useRef(null);
  const priceMinTimeout = useRef(null);
  const priceMaxTimeout = useRef(null);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Get current filter values from URL
  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const genderFilter = searchParams.get("gender")
    ? searchParams.get("gender").split(",").filter(Boolean)
    : [];
  const productType = searchParams.get("productType") || "";
  const brandFilter = searchParams.get("brand")
    ? searchParams.get("brand").split(",").filter(Boolean)
    : [];
  const frameShapeFilter = searchParams.get("frameShape")
    ? searchParams.get("frameShape").split(",").filter(Boolean)
    : [];
  const lensTypeFilter = searchParams.get("lensType")
    ? searchParams.get("lensType").split(",").filter(Boolean)
    : [];
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  // Set productType from URL path
  useEffect(() => {
    if (categorySlug) {
      const typeMap = {
        eyeglasses: "eyeglasses",
        sunglasses: "sunglasses",
        "contact-lens": "contactlens",
      };
      const mappedType = typeMap[categorySlug];
      if (mappedType) {
        const params = new URLSearchParams();
        params.set("productType", mappedType);
        setSearchParams(params, { replace: true });
        setSortBy("newest");
        setSearchInput("");
        setPriceMinInput("");
        setPriceMaxInput("");
      }
    }
  }, [categorySlug]);

  // Sync sortBy with URL
  useEffect(() => {
    const urlSort = searchParams.get("sort");
    if (urlSort && urlSort !== sortBy) setSortBy(urlSort);
  }, [searchParams]);

  // ✅ FIXED: Sync URL → local input ONLY when NOT typing
  // This prevents overwriting user input during typing
  useEffect(() => {
    if (!isTypingRef.current.search && searchQuery !== searchInput) {
      setSearchInput(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isTypingRef.current.priceMin && minPrice !== priceMinInput) {
      setPriceMinInput(minPrice);
    }
  }, [minPrice]);

  useEffect(() => {
    if (!isTypingRef.current.priceMax && maxPrice !== priceMaxInput) {
      setPriceMaxInput(maxPrice);
    }
  }, [maxPrice]);

  // Helper function to get display price with discount
  const getDisplayPrice = useCallback((product) => {
    let displayPrice = product.price || 0;
    let originalPrice = product.price || 0;
    let hasDiscount = false;
    let discountPercent = 0;

    if (product.variants && product.variants.length > 0) {
      const variantPrices = product.variants.map((v) => v.price || 0);
      const variantComparePrices = product.variants.map(
        (v) => v.comparePrice || 0,
      );
      const minPrice = Math.min(...variantPrices);
      const minCompare = Math.min(...variantComparePrices);

      if (minCompare > 0 && minCompare < minPrice) {
        displayPrice = minCompare;
        originalPrice = minPrice;
        hasDiscount = true;
        discountPercent = Math.round(
          ((minPrice - minCompare) / minPrice) * 100,
        );
      } else {
        displayPrice = minPrice;
        originalPrice = minPrice;
      }
    } else {
      if (product.comparePrice && product.comparePrice < product.price) {
        displayPrice = product.comparePrice;
        originalPrice = product.price;
        hasDiscount = true;
        discountPercent = Math.round(
          ((product.price - product.comparePrice) / product.price) * 100,
        );
      } else {
        displayPrice = product.price || 0;
        originalPrice = product.price || 0;
      }
    }

    return { displayPrice, originalPrice, hasDiscount, discountPercent };
  }, []);

  // Page title
  const getPageTitle = useCallback(() => {
    const parts = [];

    if (categoryFilter) {
      const cat = categoriesData?.find((c) => c.slug === categoryFilter);
      if (cat) parts.push(cat.name);
    }

    if (brandFilter.length === 1) {
      const brand = brandsData?.find((b) => b.slug === brandFilter[0]);
      if (brand) parts.push(brand.name);
    }

    if (productType) {
      const typeLabels = {
        eyeglasses: "Eyeglasses",
        sunglasses: "Sunglasses",
        contactlens: "Contact Lenses",
      };
      parts.push(typeLabels[productType] || productType);
    }

    if (genderFilter.length === 1) {
      parts.push(
        "for " +
          genderFilter[0].charAt(0).toUpperCase() +
          genderFilter[0].slice(1),
      );
    }

    if (parts.length > 0) return parts.join(" ");
    return "All Products";
  }, [categoryFilter, brandFilter, productType, genderFilter]);

  // ✅ FIXED: Input handlers with proper typing tracking
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    isTypingRef.current.search = true;
    setSearchInput(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      isTypingRef.current.search = false;
      updateFilter("search", value);
    }, 500);
  }, []);

  const handlePriceMinChange = useCallback((e) => {
    const value = e.target.value;
    isTypingRef.current.priceMin = true;
    setPriceMinInput(value);

    if (priceMinTimeout.current) clearTimeout(priceMinTimeout.current);
    priceMinTimeout.current = setTimeout(() => {
      isTypingRef.current.priceMin = false;
      updateFilter("minPrice", value);
    }, 600);
  }, []);

  const handlePriceMaxChange = useCallback((e) => {
    const value = e.target.value;
    isTypingRef.current.priceMax = true;
    setPriceMaxInput(value);

    if (priceMaxTimeout.current) clearTimeout(priceMaxTimeout.current);
    priceMaxTimeout.current = setTimeout(() => {
      isTypingRef.current.priceMax = false;
      updateFilter("maxPrice", value);
    }, 600);
  }, []);

  const handleCategorySearchChange = useCallback((e) => {
    setCategorySearch(e.target.value);
  }, []);

  const handleBrandSearchChange = useCallback((e) => {
    setBrandSearch(e.target.value);
  }, []);

  // Update filter
  const updateFilter = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      // If value is empty string or null/undefined, remove the parameter
      if (value === "" || value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      setSearchParams(params);
    },
    [searchParams],
  );

  // Toggle array filter
  const toggleArrayFilter = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      let currentArray = [];
      if (key === "gender") currentArray = genderFilter;
      else if (key === "brand") currentArray = brandFilter;
      else if (key === "frameShape") currentArray = frameShapeFilter;
      else if (key === "lensType") currentArray = lensTypeFilter;

      let newArray = [...currentArray];
      if (newArray.includes(value)) {
        newArray = newArray.filter((v) => v !== value);
      } else {
        newArray.push(value);
      }
      if (newArray.length > 0) {
        params.set(key, newArray.join(","));
      } else {
        params.delete(key);
      }
      setSearchParams(params);
    },
    [searchParams, genderFilter, brandFilter, frameShapeFilter, lensTypeFilter],
  );

  // Single value filter
  const setSingleFilter = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      setSearchParams(params);
    },
    [searchParams],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (productType) params.set("productType", productType);
    setSearchParams(params);
    setSortBy("newest");
    setSearchInput("");
    setPriceMinInput("");
    setPriceMaxInput("");
    setCategorySearch("");
    setBrandSearch("");
    isTypingRef.current = { search: false, priceMin: false, priceMax: false };
  }, [productType]);

  // Remove a single filter pill
  const removeFilterPill = useCallback(
    (key, value) => {
      if (key === "category") {
        setSingleFilter("category", "");
      } else if (key === "gender") {
        toggleArrayFilter("gender", value);
      } else if (key === "brand") {
        toggleArrayFilter("brand", value);
      } else if (key === "frameShape") {
        toggleArrayFilter("frameShape", value);
      } else if (key === "lensType") {
        toggleArrayFilter("lensType", value);
      } else if (key === "search") {
        updateFilter("search", "");
        setSearchInput("");
      } else if (key === "price") {
        updateFilter("minPrice", "");
        updateFilter("maxPrice", "");
        setPriceMinInput("");
        setPriceMaxInput("");
      }
    },
    [setSingleFilter, toggleArrayFilter, updateFilter],
  );

  // Toggle filter visibility - ONE unified button
  const toggleFilters = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileFilterOpen(!mobileFilterOpen);
    } else {
      setFiltersOpen(!filtersOpen);
    }
  }, [mobileFilterOpen, filtersOpen]);

  // Build query string
  const buildQueryString = useCallback(
    (pageParam = 1) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", "12");
      if (sortBy) params.set("sort", sortBy);
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter) params.set("category", categoryFilter);
      if (genderFilter.length > 0) params.set("gender", genderFilter.join(","));
      if (productType) params.set("productType", productType);
      if (brandFilter.length > 0) params.set("brand", brandFilter.join(","));
      if (frameShapeFilter.length > 0)
        params.set("frameShape", frameShapeFilter.join(","));
      if (lensTypeFilter.length > 0)
        params.set("lensType", lensTypeFilter.join(","));
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      return params.toString();
    },
    [
      sortBy,
      searchQuery,
      categoryFilter,
      genderFilter,
      productType,
      brandFilter,
      frameShapeFilter,
      lensTypeFilter,
      minPrice,
      maxPrice,
    ],
  );

  // Infinite query
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["products", buildQueryString()],
      queryFn: async ({ pageParam = 1 }) => {
        const { data } = await axios.get(
          `${API_URL}/products?${buildQueryString(pageParam)}`,
        );
        return data;
      },
      getNextPageParam: (lastPage) => {
        if (
          lastPage?.pagination &&
          lastPage.pagination.page < lastPage.pagination.pages
        ) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    });

  // Fetch categories and brands
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories || [];
    },
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands || [];
    },
  });

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    return (
      categoriesData?.filter((cat) =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
      ) || []
    );
  }, [categoriesData, categorySearch]);

  // Filter brands by search
  const filteredBrands = useMemo(() => {
    return (
      brandsData?.filter((brand) =>
        brand.name.toLowerCase().includes(brandSearch.toLowerCase()),
      ) || []
    );
  }, [brandsData, brandSearch]);

  // Frame shape options
  const frameShapeOptions = useMemo(
    () => [
      "rectangle",
      "round",
      "cat-eye",
      "square",
      "oval",
      "aviator",
      "wayfarer",
    ],
    [],
  );

  // Lens type options
  const lensTypeOptions = useMemo(
    () => [
      "single-vision",
      "bifocal",
      "progressive",
      "blue-cut",
      "photochromic",
      "polarized",
    ],
    [],
  );

  // Infinite scroll observer
  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (priceMinTimeout.current) clearTimeout(priceMinTimeout.current);
      if (priceMaxTimeout.current) clearTimeout(priceMaxTimeout.current);
    };
  }, []);

  // Flatten all products from all pages
  const allProducts =
    data?.pages?.flatMap((page) => page?.products || []) || [];
  const totalProducts = data?.pages?.[0]?.pagination?.total || 0;

  const hasActiveFilters =
    searchQuery ||
    categoryFilter ||
    genderFilter.length > 0 ||
    brandFilter.length > 0 ||
    frameShapeFilter.length > 0 ||
    lensTypeFilter.length > 0 ||
    minPrice ||
    maxPrice;

  // Get active filter pills
  const filterPills = useMemo(() => {
    const pills = [];
    if (searchQuery)
      pills.push({ key: "search", label: `Search: "${searchQuery}"` });
    if (categoryFilter) {
      const cat = categoriesData?.find((c) => c.slug === categoryFilter);
      if (cat)
        pills.push({ key: "category", label: cat.name, value: categoryFilter });
    }
    genderFilter.forEach((g) =>
      pills.push({
        key: "gender",
        label: g.charAt(0).toUpperCase() + g.slice(1),
        value: g,
      }),
    );
    brandFilter.forEach((b) => {
      const brand = brandsData?.find((br) => br.slug === b);
      if (brand) pills.push({ key: "brand", label: brand.name, value: b });
    });
    frameShapeFilter.forEach((f) =>
      pills.push({
        key: "frameShape",
        label: f.charAt(0).toUpperCase() + f.slice(1).replace("-", " "),
        value: f,
      }),
    );
    lensTypeFilter.forEach((l) =>
      pills.push({
        key: "lensType",
        label: l
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        value: l,
      }),
    );
    if (minPrice || maxPrice) {
      pills.push({
        key: "price",
        label: `₹${minPrice || "0"} - ₹${maxPrice || "∞"}`,
      });
    }
    return pills;
  }, [
    searchQuery,
    categoryFilter,
    categoriesData,
    genderFilter,
    brandFilter,
    brandsData,
    frameShapeFilter,
    lensTypeFilter,
    minPrice,
    maxPrice,
  ]);

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={`Browse our ${getPageTitle().toLowerCase()} collection at Spexxo.`}
      />

      <div className="pt-16 md:pt-10 md:pb-20 h-[calc(100vh-64px)] flex flex-col">
        <div className="container-custom flex-1 flex flex-col min-h-0">
          {/* Breadcrumb - Fixed */}
          <nav className="flex items-center gap-2 text-sm text-text-light mb-3 flex-shrink-0">
            <Link to="/" className="hover:text-primary transition">
              Home
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-primary transition">
              Shop
            </Link>
            <span>/</span>
            <span className="text-text font-medium">{getPageTitle()}</span>
          </nav>

          {/* Header - Fixed */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text">
                {getPageTitle()}
              </h1>
              <p className="text-text-light text-sm mt-1">
                {totalProducts} products found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFilters}
                className="btn-outline text-sm py-2 px-3 items-center gap-1 flex whitespace-nowrap"
              >
                <FunnelIcon className="w-4 h-4" />
                {window.innerWidth < 1024
                  ? mobileFilterOpen
                    ? "Hide Filters"
                    : "Show Filters"
                  : filtersOpen
                    ? "Hide Filters"
                    : "Show Filters"}
              </button>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilter("sort", e.target.value);
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          {filterPills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
              {filterPills.map((pill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EBF4FC] text-primary rounded-full text-xs font-medium border border-primary/20"
                >
                  {pill.label}
                  <button
                    onClick={() => removeFilterPill(pill.key, pill.value)}
                    className="hover:text-red-500 transition-colors rounded-full hover:bg-red-50 p-0.5"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {filterPills.length > 1 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:underline px-2"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          {/* Main Content - Flex 1 with overflow hidden */}
          <div className="flex gap-6 flex-1 min-h-0">
            {/* Left Filter - Fixed position, scrollable within its container */}
            {filtersOpen && (
              <aside className="hidden lg:block w-60 flex-shrink-0 h-full">
                <div className="h-full bg-white p-4 rounded-xl border border-gray-100 overflow-y-auto">
                  <h2 className="text-base font-semibold mb-4">Filters</h2>
                  <FilterSection
                    searchInput={searchInput}
                    onSearchChange={handleSearchChange}
                    categorySearch={categorySearch}
                    onCategorySearchChange={handleCategorySearchChange}
                    brandSearch={brandSearch}
                    onBrandSearchChange={handleBrandSearchChange}
                    categoriesData={categoriesData}
                    filteredCategories={filteredCategories}
                    brandsData={brandsData}
                    filteredBrands={filteredBrands}
                    categoryFilter={categoryFilter}
                    setSingleFilter={setSingleFilter}
                    genderFilter={genderFilter}
                    toggleArrayFilter={toggleArrayFilter}
                    priceMinInput={priceMinInput}
                    priceMaxInput={priceMaxInput}
                    onPriceMinChange={handlePriceMinChange}
                    onPriceMaxChange={handlePriceMaxChange}
                    brandFilter={brandFilter}
                    frameShapeFilter={frameShapeFilter}
                    frameShapeOptions={frameShapeOptions}
                    lensTypeFilter={lensTypeFilter}
                    lensTypeOptions={lensTypeOptions}
                    hasActiveFilters={hasActiveFilters}
                    clearAllFilters={clearAllFilters}
                  />
                </div>
              </aside>
            )}

            {/* Right Products - Scrollable with dynamic grid */}
            <div
              className={`flex-1 min-w-0 h-full overflow-y-auto`}
              ref={productsContainerRef}
            >
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
                    >
                      <div className="h-48 bg-gray-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allProducts.length > 0 ? (
                <>
                  {/* ✅ Dynamic grid - auto-fill with consistent card width */}
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                    }}
                  >
                    {allProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        user={user}
                        addToCart={addToCart}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        isInWishlist={isInWishlist}
                        setShowAuthPopup={setShowAuthPopup}
                        getDisplayPrice={getDisplayPrice}
                      />
                    ))}
                  </div>

                  <div ref={loadMoreRef} className="py-4 text-center">
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-text-light">Loading more...</span>
                      </div>
                    )}
                    {!hasNextPage && allProducts.length > 0 && (
                      <p className="text-text-light text-sm">
                        You've reached the end
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-100">
                  <div className="text-center p-8">
                    <p className="text-5xl mb-4">🔍</p>
                    <h3 className="text-lg font-semibold text-text mb-2">
                      No Products Found
                    </h3>
                    <p className="text-text-light mb-6 text-sm">
                      Try adjusting your filters
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="btn-primary text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <FilterSection
              searchInput={searchInput}
              onSearchChange={handleSearchChange}
              categorySearch={categorySearch}
              onCategorySearchChange={handleCategorySearchChange}
              brandSearch={brandSearch}
              onBrandSearchChange={handleBrandSearchChange}
              categoriesData={categoriesData}
              filteredCategories={filteredCategories}
              brandsData={brandsData}
              filteredBrands={filteredBrands}
              categoryFilter={categoryFilter}
              setSingleFilter={setSingleFilter}
              genderFilter={genderFilter}
              toggleArrayFilter={toggleArrayFilter}
              priceMinInput={priceMinInput}
              priceMaxInput={priceMaxInput}
              onPriceMinChange={handlePriceMinChange}
              onPriceMaxChange={handlePriceMaxChange}
              brandFilter={brandFilter}
              frameShapeFilter={frameShapeFilter}
              frameShapeOptions={frameShapeOptions}
              lensTypeFilter={lensTypeFilter}
              lensTypeOptions={lensTypeOptions}
              hasActiveFilters={hasActiveFilters}
              clearAllFilters={clearAllFilters}
            />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-8 btn-primary text-sm"
            >
              Show Results ({totalProducts})
            </button>
          </div>
        </div>
      )}

      {/* Auth Popup */}
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        mode="login"
      />
    </>
  );
};

export default Shop;
