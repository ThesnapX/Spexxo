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
} from "@heroicons/react/24/outline";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewProduct, setPreviewProduct] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=200`);
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

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted!");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed"),
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

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

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

  // Filter products
  const products = (productsData?.products || []).filter((product) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (categoryFilter) {
      const catIds = product.category
        ? product.category.split(",").filter(Boolean)
        : [];
      if (!catIds.includes(categoryFilter)) return false;
    }
    if (brandFilter) {
      const brandId =
        typeof product.brand === "object" ? product.brand?._id : product.brand;
      if (brandId !== brandFilter) return false;
    }
    if (productTypeFilter && product.productType !== productTypeFilter)
      return false;
    if (stockFilter === "in-stock" && (product.stock || 0) <= 0) return false;
    if (stockFilter === "out-of-stock" && (product.stock || 0) > 0)
      return false;
    if (stockFilter === "low-stock" && (product.stock || 0) > 3) return false;
    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setProductTypeFilter("");
    setStockFilter("");
  };

  const getCategoryNames = (product) => {
    if (!product) return "N/A";
    if (
      product.categories &&
      Array.isArray(product.categories) &&
      product.categories.length > 0
    ) {
      return product.categories.map((c) => c.name).join(", ");
    }
    if (
      product.category &&
      typeof product.category === "object" &&
      product.category !== null &&
      product.category.name
    ) {
      return product.category.name;
    }
    if (typeof product.category === "string" && product.category) {
      const ids = product.category.split(",").filter(Boolean);
      if (ids.length === 0) return "N/A";
      return (
        ids
          .map((id) => {
            const cat = categories?.find((c) => c._id === id);
            return cat ? cat.name : id;
          })
          .join(", ") || "N/A"
      );
    }
    return "N/A";
  };

  const getBrandName = (product) => {
    if (!product || !product.brand) return "N/A";
    if (typeof product.brand === "object" && product.brand !== null) {
      return product.brand.name || "N/A";
    }
    const b = brands?.find((b) => b._id === product.brand);
    return b ? b.name : "N/A";
  };

  const PreviewModal = ({ product, onClose }) => {
    if (!product) return null;

    const discountPercent =
      product.comparePrice && product.price > product.comparePrice
        ? Math.round(
            ((product.price - product.comparePrice) / product.price) * 100,
          )
        : 0;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
            <h2 className="text-lg font-semibold text-text">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {product.images?.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={product.name}
                    className="w-24 h-24 rounded-lg object-cover border"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <PhotoIcon className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-light">Product Name</p>
                <p className="font-medium text-text">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">SKU</p>
                <p className="font-medium text-text">{product.sku || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">Categories</p>
                <p className="font-medium text-text text-sm">
                  {getCategoryNames(product)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-light">Brand</p>
                <p className="font-medium text-text">{getBrandName(product)}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">Product Type</p>
                <p className="font-medium text-text capitalize">
                  {product.productType}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-light">Gender</p>
                <p className="font-medium text-text capitalize">
                  {typeof product.gender === "string"
                    ? product.gender.split(",").join(", ")
                    : product.gender || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-text-light">Original Price</p>
                  <p className="font-semibold text-text">
                    ₹{product.price?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-light">Discounted Price</p>
                  <p className="font-semibold text-green-600">
                    {product.comparePrice
                      ? `₹${product.comparePrice.toLocaleString()}`
                      : "No discount"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-light">Stock</p>
                  <p
                    className={`font-semibold ${(product.stock || 0) > 10 ? "text-green-600" : (product.stock || 0) > 0 ? "text-orange-600" : "text-red-600"}`}
                  >
                    {product.stock || 0}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-light mb-2">Frame Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Shape: </span>
                  <span className="text-sm">
                    {typeof product.frameShape === "string"
                      ? product.frameShape.split(",").join(", ")
                      : product.frameShape || "N/A"}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Material: </span>
                  <span className="text-sm">
                    {typeof product.frameMaterial === "string"
                      ? product.frameMaterial.split(",").join(", ")
                      : product.frameMaterial || "N/A"}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Color: </span>
                  <span className="text-sm">{product.frameColor || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Lens: </span>
                  <span className="text-sm">
                    {typeof product.lensType === "string"
                      ? product.lensType.split(",").join(", ")
                      : product.lensType || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            {product.specifications?.length > 0 && (
              <div>
                <p className="text-xs text-text-light mb-2">Dimensions</p>
                <div className="grid grid-cols-5 gap-2">
                  {product.specifications.map((spec, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-2 rounded-lg text-center"
                    >
                      <p className="text-xs text-text-light">{spec.name}</p>
                      <p className="text-sm font-medium">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-text-light mb-1">Description</p>
              <p className="text-sm text-text">
                {product.description || "No description"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.isFeatured && (
                <span className="px-2 py-1 bg-[#EBF4FC] text-[#3D96EB] text-xs rounded-full">
                  Featured
                </span>
              )}
              {product.isTrending && (
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                  Trending
                </span>
              )}
              {product.isNewArrival && (
                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                  New Arrival
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                  Best Seller
                </span>
              )}
              {product.isActive ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div className="p-6 border-t sticky bottom-0 bg-white rounded-b-2xl flex gap-3 flex-wrap">
            <button
              onClick={() => {
                onClose();
                navigate(`/admin/products/edit/${product._id}`);
              }}
              className="btn-primary text-sm flex-1"
            >
              <PencilIcon className="w-4 h-4" /> Edit Product
            </button>
            <button
              onClick={() => handleCopyLink(product)}
              className="btn-outline text-sm"
            >
              <LinkIcon className="w-4 h-4" /> Copy Link
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(`/admin/products/reviews/${product._id}`);
              }}
              className="btn-outline text-sm"
            >
              <StarIcon className="w-4 h-4" /> Reviews
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">All Products</h1>
          <p className="text-sm text-text-light mt-1">
            {products.length} products found
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>
          {(searchQuery ||
            categoryFilter ||
            brandFilter ||
            productTypeFilter ||
            stockFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:underline mt-3"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

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
            const discountPercent =
              product.comparePrice && product.price > product.comparePrice
                ? Math.round(
                    ((product.price - product.comparePrice) / product.price) *
                      100,
                  )
                : 0;
            const brandDisplay =
              typeof product.brand === "object"
                ? product.brand?.name
                : getBrandName(product);

            return (
              <div
                key={product._id}
                className={`group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 ${product.isActive ? "border-gray-100" : "border-red-200 opacity-60"}`}
              >
                <div
                  className="relative bg-gray-50 cursor-pointer"
                  onClick={() => setPreviewProduct(product)}
                >
                  {product.images?.[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400">
                      <PhotoIcon className="w-10 h-10" />
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {!product.isActive && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setPreviewProduct(product)}
                >
                  <p className="text-xs text-text-light mb-1 truncate">
                    {brandDisplay || "No Brand"}
                  </p>
                  <h3 className="font-medium text-sm text-text mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-text">
                      ₹
                      {(
                        product.comparePrice || product.price
                      )?.toLocaleString()}
                    </span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-medium ${(product.stock || 0) > 10 ? "text-green-600" : (product.stock || 0) > 0 ? "text-orange-600" : "text-red-600"}`}
                    >
                      {product.stock || 0} in stock
                    </span>
                    {(product.stock || 0) === 0 && (
                      <span className="text-xs text-red-500">
                        Out of Stock!
                      </span>
                    )}
                    {(product.stock || 0) > 0 && (product.stock || 0) <= 3 && (
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
                  </div>
                </div>
                <div
                  className="flex justify-end gap-1 px-3 pb-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewProduct(product);
                    }}
                    className="p-2 text-gray-500 hover:text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                    title="Preview"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(product);
                    }}
                    className={`p-2 rounded-lg transition ${copiedId === product._id ? "text-green-500 bg-green-50" : "text-gray-500 hover:text-green-500 hover:bg-green-50"}`}
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
                    className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(product._id);
                    }}
                    className={`p-2 rounded-lg transition ${product.isActive ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
                    title={product.isActive ? "Deactivate" : "Activate"}
                  >
                    {product.isActive ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XMarkIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product._id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewProduct && (
        <PreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  );
};

export default Products;
