// frontend/src/components/admin/blog/ProductPicker.jsx

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProductPicker = ({ isOpen, onClose, initialProducts = [], onSave }) => {
  const [selected, setSelected] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Filters (client-side, same pattern as admin Products page) ──
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState(""); // "simple" | "variable"
  const [stockFilter, setStockFilter] = useState(""); // "in-stock" | "out-of-stock"
  const [statusFilter, setStatusFilter] = useState(""); // "active" | "inactive"

  useEffect(() => {
    if (isOpen) {
      setSelected(initialProducts);
      setSearch("");
      setCategoryFilter("");
      setBrandFilter("");
      setProductTypeFilter("");
      setStockFilter("");
      setStatusFilter("");
      setShowFilters(false);
    }
  }, [isOpen, initialProducts]);

  // ── Fetch ALL products once, filter client-side ──
  const { data, isLoading } = useQuery({
    queryKey: ["product-picker-all"],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: 500,
        includeInactive: "true",
        hideOutOfStock: "false",
      });
      const { data } = await axios.get(`${API_URL}/products?${params}`);
      return data.products || [];
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // ── Fetch categories & brands for filter dropdowns ──
  const { data: categoriesData } = useQuery({
    queryKey: ["picker-categories"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/categories`);
        return data.categories || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["picker-brands"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/brands`);
        return data.brands || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });

  const categories = categoriesData || [];
  const brands = brandsData || [];
  const allProducts = data || [];

  // ── Apply all filters client-side ──
  const products = useMemo(() => {
    return allProducts.filter((p) => {
      // Search
      if (search.trim()) {
        const s = search.toLowerCase();
        const matches =
          p.name?.toLowerCase().includes(s) ||
          p.sku?.toLowerCase().includes(s) ||
          p.brand?.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s);
        if (!matches) return false;
      }

      // Category (product can have multiple categories; product.category
      // is a comma-separated string OR the object has `categories` array)
      if (categoryFilter) {
        const catIds =
          Array.isArray(p.categories) && p.categories.length > 0
            ? p.categories.map((c) => (typeof c === "object" ? c._id : c))
            : typeof p.category === "string"
              ? p.category.split(",").filter(Boolean)
              : p.category && typeof p.category === "object"
                ? [p.category._id]
                : [];
        if (!catIds.includes(categoryFilter)) return false;
      }

      // Brand
      if (brandFilter) {
        const brandId = typeof p.brand === "object" ? p.brand?._id : p.brand;
        if (brandId !== brandFilter) return false;
      }

      // Product type
      if (productTypeFilter && p.productType !== productTypeFilter) {
        return false;
      }

      // Stock
      const hasVariants = p.variants && p.variants.length > 0;
      const totalStock = hasVariants
        ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : p.stock || 0;
      if (stockFilter === "in-stock" && totalStock <= 0) return false;
      if (stockFilter === "out-of-stock" && totalStock > 0) return false;
      if (stockFilter === "low-stock" && (totalStock > 3 || totalStock <= 0))
        return false;

      // Status
      if (statusFilter === "active" && p.isActive === false) return false;
      if (statusFilter === "inactive" && p.isActive !== false) return false;

      return true;
    });
  }, [
    allProducts,
    search,
    categoryFilter,
    brandFilter,
    productTypeFilter,
    stockFilter,
    statusFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setBrandFilter("");
    setProductTypeFilter("");
    setStockFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters =
    search ||
    categoryFilter ||
    brandFilter ||
    productTypeFilter ||
    stockFilter ||
    statusFilter;

  const toggle = (product) => {
    const exists = selected.find((p) => p._id === product._id);
    if (exists) {
      setSelected(selected.filter((p) => p._id !== product._id));
    } else {
      // Store full snapshot so blog cards render identically to Shop.
      setSelected([
        ...selected,
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice,
          images: product.images,
          brand: product.brand,
          stock: product.stock,
          productType: product.productType,
          variants: product.variants,
          ratings: product.ratings,
          isActive: product.isActive,
        },
      ]);
    }
  };

  const removeSelected = (id) => {
    setSelected(selected.filter((p) => p._id !== id));
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const getDisplayPrice = (product) => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((v) => v.price || 0);
      const compares = product.variants
        .map((v) => v.comparePrice || 0)
        .filter((c) => c > 0);
      const minPrice = Math.min(...prices);
      const minCompare = compares.length ? Math.min(...compares) : 0;
      if (minCompare && minCompare < minPrice) {
        return { display: minCompare, original: minPrice, hasDiscount: true };
      }
      return { display: minPrice, original: minPrice, hasDiscount: false };
    }
    if (product.comparePrice && product.comparePrice < product.price) {
      return {
        display: product.comparePrice,
        original: product.price,
        hasDiscount: true,
      };
    }
    return {
      display: product.price || 0,
      original: product.price || 0,
      hasDiscount: false,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-text">Select Products</h3>
            <p className="text-xs text-text-light">
              {selected.length} selected ·{" "}
              {products.length !== allProducts.length
                ? `${products.length} of ${allProducts.length} shown`
                : `${allProducts.length} products`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Filter toggle */}
        <div className="p-3 border-b flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, brand…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition ${
              showFilters || hasActiveFilters
                ? "border-primary bg-[#EBF4FC] text-primary font-medium"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="px-3 py-3 border-b bg-gray-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* Category */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-light mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-light mb-1">
                  Brand
                </label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product type */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-light mb-1">
                  Type
                </label>
                <select
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">All Types</option>
                  <option value="simple">Simple</option>
                  <option value="variable">Variable</option>
                </select>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-light mb-1">
                  Stock
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">All Stock</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="low-stock">Low Stock (≤3)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-text-light mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-red-500 hover:underline mt-2"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="px-3 py-2 border-b bg-gray-50 flex flex-wrap gap-1.5">
            {selected.map((p) => (
              <span
                key={p._id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[11px]"
              >
                <span className="max-w-[120px] truncate">{p.name}</span>
                <button
                  type="button"
                  onClick={() => removeSelected(p._id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <p className="text-center py-8 text-sm text-text-light">Loading…</p>
          ) : products.length === 0 ? (
            <p className="text-center py-8 text-sm text-text-light">
              {hasActiveFilters
                ? "No products match your filters"
                : "No products found"}
            </p>
          ) : (
            <div className="space-y-1">
              {products.map((p) => {
                const isSelected = selected.some((s) => s._id === p._id);
                const isDeactivated = p.isActive === false;
                const hasVariants = p.variants && p.variants.length > 0;
                const variantCount = hasVariants ? p.variants.length : 0;
                const allVariantsOutOfStock =
                  hasVariants && p.variants.every((v) => (v.stock || 0) <= 0);
                const totalStock = hasVariants
                  ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                  : p.stock || 0;
                const outOfStock = hasVariants
                  ? allVariantsOutOfStock
                  : (p.stock || 0) <= 0;

                const priceInfo = getDisplayPrice(p);

                let imgUrl = "";
                if (hasVariants) {
                  const defaultV =
                    p.variants.find((v) => v.isDefault) || p.variants[0];
                  imgUrl =
                    defaultV?.images?.[0]?.url || p.images?.[0]?.url || "";
                } else {
                  imgUrl = p.images?.[0]?.url || "";
                }

                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => toggle(p)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition ${
                      isSelected
                        ? "border-primary bg-[#EBF4FC]"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text truncate">
                          {p.name}
                        </p>
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                            hasVariants
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {hasVariants
                            ? `Variable (${variantCount})`
                            : "Simple"}
                        </span>
                        {isDeactivated && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                        {outOfStock && !isDeactivated && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-light">
                        {p.brand?.name && <span>{p.brand.name}</span>}
                        {p.brand?.name && p.categories?.length > 0 && (
                          <span>•</span>
                        )}
                        {p.categories?.length > 0 && (
                          <span className="truncate">
                            {p.categories
                              .slice(0, 2)
                              .map((c) => c.name)
                              .join(", ")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-text">
                          ₹{priceInfo.display?.toLocaleString?.()}
                        </span>
                        {priceInfo.hasDiscount && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{priceInfo.original?.toLocaleString?.()}
                            </span>
                            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                              {Math.round(
                                ((priceInfo.original - priceInfo.display) /
                                  priceInfo.original) *
                                  100,
                              )}
                              % off
                            </span>
                          </>
                        )}
                      </div>

                      <p
                        className={`text-[11px] mt-0.5 ${
                          totalStock > 10
                            ? "text-green-600"
                            : totalStock > 0
                              ? "text-orange-600"
                              : "text-red-600"
                        }`}
                      >
                        {totalStock} in stock
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary mt-1"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary text-sm flex-1"
          >
            Save ({selected.length})
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPicker;
