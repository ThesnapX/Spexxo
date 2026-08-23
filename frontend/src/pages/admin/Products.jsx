// frontend/src/pages/admin/Products.jsx

import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
  EyeIcon,
  LinkIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  EyeSlashIcon,
  EyeIcon as EyeIconShow,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products - include ALL products (including inactive)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products", statusFilter],
    queryFn: async () => {
      let url = `${API_URL}/products?limit=200&includeInactive=true`;
      if (statusFilter === "active") {
        url += "&isActive=true";
      } else if (statusFilter === "inactive") {
        url += "&isActive=false";
      }
      const { data } = await axios.get(url);
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories || [];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["admin-brands-list"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      await axios.put(`${API_URL}/products/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product status updated!");
    },
  });

  const handleToggle = (id) => {
    toggleMutation.mutate(id);
  };

  const handleCopyLink = (product) => {
    const link = `${FRONTEND_URL}/product/${product.slug}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopiedId(product._id);
        toast.success("Link copied!");
        window.open(link, "_blank");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        window.open(link, "_blank");
        toast.success("Product opened in new tab");
      });
  };

  // ✅ Helper function to get the product image (with variant support)
  const getProductImage = (product) => {
    // For variable products, try to get the default variant's image
    if (product.variants && product.variants.length > 0) {
      // Find the default variant
      let defaultVariant = product.variants.find((v) => v.isDefault === true);
      // If no default variant is marked, use the first one
      if (!defaultVariant) {
        defaultVariant = product.variants[0];
      }
      // Check if the default variant has images
      if (defaultVariant.images && defaultVariant.images.length > 0) {
        return defaultVariant.images[0].url;
      }
    }
    // Fallback to product images
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return null;
  };

  // Helper function to get total stock (main + variants)
  const getTotalStock = (product) => {
    let total = product.stock || 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        total += v.stock || 0;
      });
    }
    return total;
  };

  // ✅ Helper function to get display price with discount
  const getDisplayPrice = (product) => {
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
  };

  // Filter products - includes ALL products
  const products = (productsData?.products || []).filter((product) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    // Category filter
    if (categoryFilter) {
      const catIds = product.category
        ? product.category.split(",").filter(Boolean)
        : [];
      if (!catIds.includes(categoryFilter)) return false;
    }
    // Brand filter
    if (brandFilter) {
      const brandId =
        typeof product.brand === "object" ? product.brand?._id : product.brand;
      if (brandId !== brandFilter) return false;
    }
    // Product type filter
    if (productTypeFilter && product.productType !== productTypeFilter)
      return false;
    // Stock filter - Check both main stock and variant stock
    if (stockFilter === "in-stock") {
      const totalStock = getTotalStock(product);
      if (totalStock <= 0) return false;
    }
    if (stockFilter === "out-of-stock") {
      const totalStock = getTotalStock(product);
      if (totalStock > 0) return false;
    }
    if (stockFilter === "low-stock") {
      const totalStock = getTotalStock(product);
      if (totalStock > 3) return false;
    }
    // Status filter - already handled by API, but also filter locally
    if (statusFilter === "active" && !product.isActive) return false;
    if (statusFilter === "inactive" && product.isActive) return false;
    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setProductTypeFilter("");
    setStockFilter("");
    setStatusFilter("");
  };

  const getBrandName = (product) => {
    if (!product || !product.brand) return "N/A";
    if (typeof product.brand === "object" && product.brand !== null) {
      return product.brand.name || "N/A";
    }
    const b = brands?.find((b) => b._id === product.brand);
    return b ? b.name : "N/A";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">All Products</h1>
          <p className="text-sm text-text-light mt-1">
            {products.length} products found
            {statusFilter && (
              <span className="ml-2 text-xs">
                ({statusFilter === "active" ? "Active" : "Inactive"})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-1"
          >
            <FunnelIcon className="w-4 h-4" />{" "}
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={() => navigate("/admin/products/add")}
            className="btn-primary text-sm"
          >
            <PlusIcon className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-text-light mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Categories</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Brand
              </label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Brands</option>
                {brands?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Product Type
              </label>
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="eyeglasses">Eyeglasses</option>
                <option value="sunglasses">Sunglasses</option>
                <option value="contactlens">Contact Lens</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock (≤3)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {(searchQuery ||
            categoryFilter ||
            brandFilter ||
            productTypeFilter ||
            stockFilter ||
            statusFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:underline mt-3"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Products Found
          </h3>
          <p className="text-text-light mb-6 text-sm">
            {searchQuery || categoryFilter || brandFilter
              ? "Try adjusting your search or filters"
              : "Start adding products to your store"}
          </p>
          {searchQuery || categoryFilter || brandFilter ? (
            <button onClick={clearFilters} className="btn-outline text-sm">
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => navigate("/admin/products/add")}
              className="btn-primary text-sm"
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => {
            const brandDisplay = getBrandName(product);
            const isDeactivated = !product.isActive;
            const hasVariants = product.variants && product.variants.length > 0;
            const variantCount = hasVariants ? product.variants.length : 0;
            const totalStock = getTotalStock(product);

            // Get price with discount
            const {
              displayPrice,
              originalPrice,
              hasDiscount,
              discountPercent,
            } = getDisplayPrice(product);

            // ✅ Get the product image (with variant support)
            const productImage = getProductImage(product);

            return (
              <div
                key={product._id}
                className={`group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  isDeactivated
                    ? "border-gray-200 opacity-60 grayscale"
                    : "border-gray-100"
                }`}
              >
                <div
                  className="relative bg-gray-50 cursor-pointer"
                  onClick={() =>
                    navigate(`/admin/products/view/${product._id}`)
                  }
                >
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={product.name}
                      className={`w-full h-48 object-cover transition-transform duration-300 ${
                        isDeactivated ? "opacity-50" : "group-hover:scale-105"
                      }`}
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400">
                      <PhotoIcon className="w-10 h-10" />
                    </div>
                  )}
                  {isDeactivated ? (
                    <span className="absolute top-2 left-2 bg-gray-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  ) : (
                    hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {discountPercent}% OFF
                      </span>
                    )
                  )}
                  {/* Has Variants Badge - Top Right */}
                  {hasVariants && !isDeactivated && (
                    <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Squares2X2Icon className="w-3 h-3" />
                      {variantCount} Variants
                    </span>
                  )}
                  {isDeactivated && (
                    <div className="absolute inset-0 bg-gray-400/10 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[-15deg] shadow-lg">
                        DEACTIVATED
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={`p-4 cursor-pointer ${
                    isDeactivated ? "opacity-75" : ""
                  }`}
                  onClick={() =>
                    navigate(`/admin/products/view/${product._id}`)
                  }
                >
                  <p className="text-xs text-text-light mb-1 truncate">
                    {brandDisplay || "No Brand"}
                    {isDeactivated && (
                      <span className="ml-2 text-xs text-red-500 font-medium">
                        • Inactive
                      </span>
                    )}
                    {hasVariants && !isDeactivated && (
                      <span className="ml-2 text-xs text-purple-500 font-medium">
                        • {variantCount} Variants
                      </span>
                    )}
                  </p>
                  <h3 className="font-medium text-sm text-text mb-2 line-clamp-1">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`font-bold ${
                        isDeactivated ? "text-gray-400" : "text-text"
                      }`}
                    >
                      ₹{displayPrice?.toLocaleString()}
                    </span>
                    {hasDiscount && !isDeactivated && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{originalPrice?.toLocaleString()}
                      </span>
                    )}
                    {hasDiscount && !isDeactivated && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {discountPercent}% off
                      </span>
                    )}
                    {hasVariants && !isDeactivated && (
                      <span className="text-xs text-purple-500 font-medium ml-1">
                        (from {variantCount} variants)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-medium ${
                        totalStock > 10
                          ? "text-green-600"
                          : totalStock > 0
                            ? "text-orange-600"
                            : "text-red-600"
                      }`}
                    >
                      {totalStock} in stock
                    </span>
                    {totalStock === 0 && (
                      <span className="text-xs text-red-500">
                        Out of Stock!
                      </span>
                    )}
                    {totalStock > 0 && totalStock <= 3 && (
                      <span className="text-xs text-orange-500">
                        Low Stock!
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {product.isFeatured && (
                      <span className="px-1.5 py-0.5 bg-[#EBF4FC] text-[#3D96EB] text-[10px] rounded-full">
                        Featured
                      </span>
                    )}
                    {product.isTrending && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded-full">
                        Trending
                      </span>
                    )}
                    {product.isNewArrival && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded-full">
                        New
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full">
                        Best Seller
                      </span>
                    )}
                    {hasVariants && !isDeactivated && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full flex items-center gap-0.5">
                        <Squares2X2Icon className="w-2.5 h-2.5" />
                        {variantCount} Variants
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="flex justify-end gap-1 px-3 pb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/products/view/${product._id}`);
                    }}
                    className={`p-2 rounded-lg transition ${
                      isDeactivated
                        ? "text-gray-400 hover:bg-gray-50"
                        : "text-gray-500 hover:text-[#3D96EB] hover:bg-[#EBF4FC]"
                    }`}
                    title="View"
                  >
                    {isDeactivated ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIconShow className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(product);
                    }}
                    className={`p-2 rounded-lg transition ${
                      copiedId === product._id
                        ? "text-green-500 bg-green-50"
                        : isDeactivated
                          ? "text-gray-400 hover:bg-gray-50"
                          : "text-gray-500 hover:text-green-500 hover:bg-green-50"
                    }`}
                    title="Copy Link"
                  >
                    {copiedId === product._id ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/products/edit/${product._id}`);
                    }}
                    className={`p-2 rounded-lg transition ${
                      isDeactivated
                        ? "text-gray-400 hover:bg-gray-50"
                        : "text-[#3D96EB] hover:bg-[#EBF4FC]"
                    }`}
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(product._id);
                    }}
                    className={`p-2 rounded-lg transition ${
                      isDeactivated
                        ? "text-green-500 hover:bg-green-50"
                        : "text-green-500 hover:bg-green-50"
                    }`}
                    title={isDeactivated ? "Activate" : "Deactivate"}
                  >
                    {isDeactivated ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XMarkIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
