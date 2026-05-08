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
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewProduct, setPreviewProduct] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=100`);
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
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopyLink = (product) => {
    const link = `${FRONTEND_URL}/product/${product.slug}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopiedId(product._id);
        toast.success("Link copied!");
        // Open in new tab
        window.open(link, "_blank");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        // Fallback if clipboard API fails
        window.open(link, "_blank");
        toast.success("Product opened in new tab");
      });
  };

  const products = productsData?.products || [];

  // Preview Modal Component
  const PreviewModal = ({ product, onClose }) => {
    if (!product) return null;

    const discountPercent =
      product.comparePrice && product.price > product.comparePrice
        ? Math.round(
            ((product.price - product.comparePrice) / product.price) * 100,
          )
        : 0;

    const categoryName =
      categories.find(
        (c) => c._id === (product.category?._id || product.category),
      )?.name || "N/A";
    const brandName =
      brands.find((b) => b._id === (product.brand?._id || product.brand))
        ?.name || "N/A";

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
            <h2 className="text-lg font-semibold text-text">Product Preview</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Images */}
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

            {/* Basic Info */}
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
                <p className="text-xs text-text-light">Category</p>
                <p className="font-medium text-text">{categoryName}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">Brand</p>
                <p className="font-medium text-text">{brandName}</p>
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
                  {product.gender}
                </p>
              </div>
            </div>

            {/* Pricing */}
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
                  <p className="text-xs text-text-light">Discount</p>
                  <p className="font-semibold text-red-500">
                    {discountPercent > 0 ? `${discountPercent}% OFF` : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Frame Details */}
            <div>
              <p className="text-xs text-text-light mb-2">Frame Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Shape: </span>
                  <span className="text-sm capitalize">
                    {product.frameShape || "N/A"}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Material: </span>
                  <span className="text-sm capitalize">
                    {product.frameMaterial || "N/A"}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Color: </span>
                  <span className="text-sm">{product.frameColor || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-text-light">Lens: </span>
                  <span className="text-sm capitalize">
                    {product.lensType || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {product.specifications?.length > 0 && (
              <div>
                <p className="text-xs text-text-light mb-2">Dimensions</p>
                <div className="grid grid-cols-4 gap-2">
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

            {/* Description */}
            <div>
              <p className="text-xs text-text-light mb-1">Description</p>
              <p className="text-sm text-text">
                {product.description || "No description"}
              </p>
            </div>

            {/* Flags */}
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

          {/* Footer */}
          <div className="p-6 border-t sticky bottom-0 bg-white rounded-b-2xl flex gap-3">
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
              <LinkIcon className="w-4 h-4" /> Copy Link & Open
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">All Products</h1>
          <p className="text-sm text-text-light mt-1">
            {products.length} products found
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/add")}
          className="btn-primary text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Product
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Category
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Price
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Discounted
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Stock
                </th>
                <th className="text-center p-4 text-sm font-medium text-text-light">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="w-8 h-8 border-4 border-[#3D96EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-text-light mt-3 text-sm">
                      Loading products...
                    </p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-text mb-2">
                        No Products Yet
                      </h3>
                      <p className="text-text-light mb-6 text-sm">
                        Start adding products to your store inventory
                      </p>
                      <button
                        onClick={() => navigate("/admin/products/add")}
                        className="btn-primary text-sm"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const discountPercent =
                    product.comparePrice && product.price > product.comparePrice
                      ? Math.round(
                          ((product.price - product.comparePrice) /
                            product.price) *
                            100,
                        )
                      : 0;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Product Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBagIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-text line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-text-light">
                              {product.brand?.name || "No Brand"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="text-sm text-text-light">
                          {product.category?.name || "N/A"}
                        </span>
                      </td>

                      {/* Original Price */}
                      <td className="p-4">
                        <p className="text-sm font-medium text-text">
                          ₹{product.price?.toLocaleString()}
                        </p>
                      </td>

                      {/* Discounted Price */}
                      <td className="p-4">
                        {product.comparePrice ? (
                          <div>
                            <p className="text-sm font-semibold text-green-600">
                              ₹{product.comparePrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-red-500">
                              -{discountPercent}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-text-light">
                            No discount
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-4">
                        <span
                          className={`text-sm font-medium ${
                            (product.stock || 0) > 10
                              ? "text-green-600"
                              : (product.stock || 0) > 0
                                ? "text-orange-600"
                                : "text-red-600"
                          }`}
                        >
                          {product.stock || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewProduct(product)}
                            className="p-2 text-gray-500 hover:text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                            title="Preview Product"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {/* Copy Link Button */}
                          <button
                            onClick={() => handleCopyLink(product)}
                            className={`p-2 rounded-lg transition ${
                              copiedId === product._id
                                ? "text-green-500 bg-green-50"
                                : "text-gray-500 hover:text-green-500 hover:bg-green-50"
                            }`}
                            title="Copy Link & Open"
                          >
                            {copiedId === product._id ? (
                              <CheckIcon className="w-4 h-4" />
                            ) : (
                              <LinkIcon className="w-4 h-4" />
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() =>
                              navigate(`/admin/products/edit/${product._id}`)
                            }
                            className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                            title="Edit Product"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
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
