import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  StarIcon,
  HeartIcon,
  ShoppingBagIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import SEO from "../components/common/SEO";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Shop = () => {
  const { category: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [priceMinInput, setPriceMinInput] = useState(
    searchParams.get("minPrice") || "",
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    searchParams.get("maxPrice") || "",
  );
  const searchTimeout = useRef(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Sync sortBy with URL
  useEffect(() => {
    const urlSort = searchParams.get("sort");
    if (urlSort && urlSort !== sortBy) {
      setSortBy(urlSort);
    }
  }, [searchParams]);

  // Get current filter values from URL
  const currentPage = Number(searchParams.get("page")) || 1;
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

  // Set productType from URL path and CLEAR other filters when nav changes
  useEffect(() => {
    if (categorySlug) {
      const typeMap = {
        eyeglasses: "eyeglasses",
        sunglasses: "sunglasses",
        "contact-lens": "contactlens",
      };
      const mappedType = typeMap[categorySlug];
      if (mappedType) {
        // Reset all filters and set only productType
        const params = new URLSearchParams();
        params.set("productType", mappedType);
        setSearchParams(params, { replace: true });
        // Reset local states
        setSortBy("newest");
        setSearchInput("");
        setPriceMinInput("");
        setPriceMaxInput("");
      }
    }
  }, [categorySlug]); // Re-run when categorySlug changes

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Sync price inputs with URL
  useEffect(() => {
    setPriceMinInput(minPrice);
    setPriceMaxInput(maxPrice);
  }, [minPrice, maxPrice]);

  // Determine page title
  const getPageTitle = () => {
    if (productType) {
      const typeLabels = {
        eyeglasses: "Eyeglasses",
        sunglasses: "Sunglasses",
        contactlens: "Contact Lenses",
      };
      return typeLabels[productType] || "All Products";
    }
    return "All Products";
  };

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      updateFilter("search", value);
    }, 400);
  };

  // Build query for API
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
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
  }, [
    currentPage,
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
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", buildQueryString()],
    queryFn: async () => {
      const queryStr = buildQueryString();
      const { data } = await axios.get(`${API_URL}/products?${queryStr}`);
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories || [];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands || [];
    },
  });

  // Toggle array filter
  const toggleArrayFilter = (key, value, currentArray) => {
    const params = new URLSearchParams(searchParams);
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
    params.set("page", "1");
    setSearchParams(params);
  };

  // Single value filter (radio style for category)
  const setSingleFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  // Update filter
  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  // Apply price filter
  const applyPriceFilter = () => {
    updateFilter("minPrice", priceMinInput);
    updateFilter("maxPrice", priceMaxInput);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (productType) params.set("productType", productType);
    setSearchParams(params);
    setSortBy("newest");
    setPriceMinInput("");
    setPriceMaxInput("");
    setSearchInput("");
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter ||
    genderFilter.length > 0 ||
    brandFilter.length > 0 ||
    frameShapeFilter.length > 0 ||
    lensTypeFilter.length > 0 ||
    minPrice ||
    maxPrice;

  const ProductCard = ({ product }) => (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative overflow-hidden bg-gray-50">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images?.[0]?.url || "https://picsum.photos/400/400"}
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        {product.comparePrice && product.comparePrice < product.price && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {Math.round(
              ((product.price - product.comparePrice) / product.price) * 100,
            )}
            % OFF
          </span>
        )}
        <button
          onClick={() =>
            isInWishlist(product._id)
              ? removeFromWishlist(product._id)
              : addToWishlist(product._id)
          }
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-all z-10"
        >
          {isInWishlist(product._id) ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-text-light mb-1">
          {product.brand?.name || ""}
        </p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-sm text-text mb-2 line-clamp-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-3.5 h-3.5 ${i < Math.round(product.ratings?.average || 0) ? "text-yellow-400 fill-current" : "text-gray-200"}`}
            />
          ))}
          <span className="text-xs text-text-light ml-1">
            ({product.ratings?.count || 0})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-text">
            ₹{(product.comparePrice || product.price)?.toLocaleString()}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.price?.toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            addToCart(product._id, 1);
            toast.success("Added to cart!");
          }}
          className="w-full mt-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition flex items-center justify-center gap-2"
        >
          <ShoppingBagIcon className="w-4 h-4" /> Add to Cart
        </button>
      </div>
    </div>
  );

  // Category - Radio style (single select)
  const CategoryFilter = () => (
    <div>
      <h3 className="font-semibold text-text text-sm mb-2">Categories</h3>
      <div className="space-y-1 max-h-44 overflow-y-auto">
        <label
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${
            !categoryFilter ? "bg-[#EBF4FC]" : "hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            name="category"
            checked={!categoryFilter}
            onChange={() => setSingleFilter("category", "")}
            className="w-4 h-4 text-primary focus:ring-primary"
          />
          <span
            className={`text-sm ${!categoryFilter ? "text-primary font-medium" : "text-text-light"}`}
          >
            All
          </span>
        </label>
        {categories?.map((cat) => (
          <label
            key={cat._id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${
              categoryFilter === cat.slug ? "bg-[#EBF4FC]" : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="category"
              checked={categoryFilter === cat.slug}
              onChange={() => setSingleFilter("category", cat.slug)}
              className="w-4 h-4 text-primary focus:ring-primary"
            />
            <span
              className={`text-sm ${categoryFilter === cat.slug ? "text-primary font-medium" : "text-text-light"}`}
            >
              {cat.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  // Multi-Select Checkbox Group
  const FilterCheckboxGroup = ({
    title,
    options,
    selectedValues,
    filterKey,
    isCategory = false,
  }) => (
    <div>
      <h3 className="font-semibold text-text text-sm mb-2">{title}</h3>
      <div className="space-y-1 max-h-44 overflow-y-auto">
        {options?.map((opt) => {
          const value = isCategory
            ? opt.slug
            : typeof opt === "string"
              ? opt
              : opt.value || opt.slug;
          const label = isCategory
            ? opt.name
            : typeof opt === "string"
              ? opt.charAt(0).toUpperCase() + opt.slice(1).replace("-", " ")
              : opt.label || opt.name;
          const isChecked = selectedValues.includes(value);

          return (
            <label
              key={value}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                isChecked ? "bg-[#EBF4FC]" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() =>
                  toggleArrayFilter(filterKey, value, selectedValues)
                }
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span
                className={`text-sm ${isChecked ? "text-primary font-medium" : "text-text-light"}`}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const FilterSection = () => (
    <div className="space-y-5">
      {/* Search with debounce */}
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Search</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Categories - Radio (Single Select) */}
      {categories?.length > 0 && <CategoryFilter />}

      {/* Gender - Multi Select */}
      <FilterCheckboxGroup
        title="Gender"
        options={["men", "women", "unisex", "kids"]}
        selectedValues={genderFilter}
        filterKey="gender"
      />

      {/* Price Range - Stable inputs */}
      <div>
        <h3 className="font-semibold text-text text-sm mb-2">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMinInput}
            onChange={(e) => setPriceMinInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPriceFilter();
            }}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceMaxInput}
            onChange={(e) => setPriceMaxInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPriceFilter();
            }}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={applyPriceFilter}
          className="w-full mt-2 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark transition"
        >
          Apply Price
        </button>
      </div>

      {/* Brands */}
      {brands?.length > 0 && (
        <FilterCheckboxGroup
          title="Brands"
          options={brands}
          selectedValues={brandFilter}
          filterKey="brand"
          isCategory={true}
        />
      )}

      {/* Frame Shape */}
      <FilterCheckboxGroup
        title="Frame Shape"
        options={[
          "rectangle",
          "round",
          "cat-eye",
          "square",
          "oval",
          "aviator",
          "wayfarer",
        ]}
        selectedValues={frameShapeFilter}
        filterKey="frameShape"
      />

      {/* Lens Type */}
      <FilterCheckboxGroup
        title="Lens Type"
        options={[
          "single-vision",
          "bifocal",
          "progressive",
          "blue-cut",
          "photochromic",
          "polarized",
        ]}
        selectedValues={lensTypeFilter}
        filterKey="lensType"
      />

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

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={`Browse our ${getPageTitle().toLowerCase()} collection at Spexxo.`}
      />

      <div className="pt-20 md:pt-24 pb-16">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-sm text-text-light mb-4">
            <Link to="/" className="hover:text-primary transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-text font-medium">{getPageTitle()}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text">
                {getPageTitle()}
              </h1>
              <p className="text-text-light text-sm mt-1">
                {data?.pagination?.total || 0} products found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden btn-outline flex items-center gap-2 text-sm py-2"
              >
                <FunnelIcon className="w-4 h-4" /> Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilter("sort", e.target.value);
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-20 bg-white p-4 rounded-xl border border-gray-100">
                <h2 className="text-base font-semibold mb-4">Filters</h2>
                <FilterSection />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
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
              ) : data?.products?.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {data.products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  {data?.pagination?.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      {[...Array(data.pagination.pages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateFilter("page", String(i + 1))}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                            currentPage === i + 1
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-text hover:bg-gray-200"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
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
            <FilterSection />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-8 btn-primary text-sm"
            >
              Show Results ({data?.pagination?.total || 0})
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
