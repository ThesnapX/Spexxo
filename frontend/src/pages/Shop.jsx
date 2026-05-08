import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const currentPage = Number(searchParams.get("page")) || 1;
  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const genderFilter = searchParams.get("gender") || "";
  const productType = searchParams.get("productType") || "";
  const brandFilter = searchParams.get("brand") || "";
  const frameShape = searchParams.get("frameShape") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("limit", 12);
    if (sortBy) params.set("sort", sortBy);
    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter) params.set("category", categoryFilter);
    if (genderFilter) params.set("gender", genderFilter);
    if (productType) params.set("productType", productType);
    if (brandFilter) params.set("brand", brandFilter);
    if (frameShape) params.set("frameShape", frameShape);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", buildQueryString()],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/products?${buildQueryString()}`,
      );
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands;
    },
  });

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

  const clearAllFilters = () => {
    setSearchParams({});
    setSortBy("newest");
    setPriceRange({ min: "", max: "" });
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter ||
    genderFilter ||
    productType ||
    brandFilter ||
    frameShape ||
    minPrice ||
    maxPrice;

  const ProductCard = ({ product }) => (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images?.[0]?.url || "/images/products/placeholder.jpg"}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {Math.round(
              ((product.comparePrice - product.price) / product.comparePrice) *
                100,
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
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-all"
        >
          {isInWishlist(product._id) ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              addToCart(product._id, 1);
              toast.success("Added to cart!");
            }}
            className="w-full bg-white text-text py-2 rounded-lg font-medium text-sm hover:bg-primary hover:text-white transition flex items-center justify-center gap-2"
          >
            <ShoppingBagIcon className="w-4 h-4" /> Add to Cart
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-text-light mb-1">
          {product.brand?.name || "Spexxo"}
        </p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-text mb-2 line-clamp-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${i < Math.round(product.ratings?.average || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
            />
          ))}
          <span className="text-xs text-text-light ml-1">
            ({product.ratings?.count || 0})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text">
            ₹{product.price?.toLocaleString()}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.comparePrice?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const FilterSection = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="font-semibold text-text mb-3">Search</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-text mb-3">Categories</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories?.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="category"
                checked={categoryFilter === cat.slug}
                onChange={() => updateFilter("category", cat.slug)}
                className="text-primary"
              />
              <span className="text-sm text-text-light">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <h3 className="font-semibold text-text mb-3">Gender</h3>
        <div className="space-y-2">
          {["men", "women", "unisex", "kids"].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={genderFilter === g}
                onChange={() => updateFilter("gender", g)}
                className="text-primary"
              />
              <span className="text-sm text-text-light capitalize">{g}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-text mb-3">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => {
            updateFilter("minPrice", priceRange.min);
            updateFilter("maxPrice", priceRange.max);
          }}
          className="w-full mt-2 btn-primary text-sm py-2"
        >
          Apply Price
        </button>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-text mb-3">Brands</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {brands?.slice(0, 10).map((brand) => (
            <label
              key={brand._id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="brand"
                checked={brandFilter === brand.slug}
                onChange={() => updateFilter("brand", brand.slug)}
                className="text-primary"
              />
              <span className="text-sm text-text-light">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Frame Shape */}
      <div>
        <h3 className="font-semibold text-text mb-3">Frame Shape</h3>
        <div className="space-y-2">
          {[
            "rectangle",
            "round",
            "cat-eye",
            "square",
            "oval",
            "aviator",
            "wayfarer",
          ].map((shape) => (
            <label
              key={shape}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="frameShape"
                checked={frameShape === shape}
                onChange={() => updateFilter("frameShape", shape)}
                className="text-primary"
              />
              <span className="text-sm text-text-light capitalize">
                {shape.replace("-", " ")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg transition text-sm font-medium"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <SEO
        title="Shop Eyewear"
        description="Browse our complete collection of premium eyeglasses, sunglasses, and contact lenses."
      />
      <div className="pt-28 pb-16">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-light mb-6">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <span className="text-text">Shop</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text">
                {productType
                  ? productType.charAt(0).toUpperCase() + productType.slice(1)
                  : "All Products"}
              </h1>
              <p className="text-text-light mt-1">
                {data?.pagination?.total || 0} products found
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden btn-outline flex items-center gap-2 text-sm"
              >
                <FunnelIcon className="w-5 h-5" /> Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilter("sort", e.target.value);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
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
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-28 bg-white p-6 rounded-xl border border-gray-100">
                <h2 className="text-lg font-semibold mb-6">Filters</h2>
                <FilterSection />
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
                    >
                      <div className="h-64 bg-gray-200"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.products?.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {data.products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  {/* Pagination */}
                  {data?.pagination?.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                      {[...Array(data.pagination.pages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateFilter("page", i + 1)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${currentPage === i + 1 ? "bg-primary text-white" : "bg-gray-100 text-text hover:bg-gray-200"}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-6xl mb-4">🔍</p>
                  <h3 className="text-xl font-semibold text-text mb-2">
                    No Products Found
                  </h3>
                  <p className="text-text-light mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <button onClick={clearAllFilters} className="btn-primary">
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
              <button onClick={() => setMobileFilterOpen(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <FilterSection />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-8 btn-primary"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
