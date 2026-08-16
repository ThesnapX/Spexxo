import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  StarIcon,
  ShoppingCartIcon,
  UsersIcon,
  PhotoIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const ProductDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("meta");

  const { data: productData, isLoading } = useQuery({
    queryKey: ["admin-product-detail", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/${id}`);
      return data.product || null;
    },
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["admin-product-reviews", id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/reviews/${id}`);
        return data.reviews || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin-product-orders", id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/orders/admin/all?limit=100`,
        );
        return (
          data.orders?.filter((order) =>
            order.items?.some(
              (item) => item.product?._id === id || item.product === id,
            ),
          ) || []
        );
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const product = productData;
  const reviews = reviewsData || [];
  const productOrders = ordersData || [];

  const tabs = [
    { id: "meta", label: "Product Meta", icon: ClipboardDocumentListIcon },
    { id: "reviews", label: "Reviews", icon: StarIcon },
    { id: "orders", label: "Ordered By", icon: UsersIcon },
    { id: "analytics", label: "Analytics", icon: ChartBarIcon },
    { id: "activity", label: "Activity", icon: PhotoIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-light">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold">Product Not Found</p>
        <button
          onClick={() => navigate("/admin/products")}
          className="btn-primary mt-4 text-sm"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const discountPercent =
    product.comparePrice && product.price > product.comparePrice
      ? Math.round(
          ((product.price - product.comparePrice) / product.price) * 100,
        )
      : 0;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/products")}
        className="flex items-center gap-2 text-text-light hover:text-primary transition mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back to Products
      </button>

      {/* Product Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {product.images?.[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-text-light">
                <span>
                  SKU: <strong>{product.sku || "N/A"}</strong>
                </span>
                <span>•</span>
                <span>
                  Brand: <strong>{product.brand?.name || "N/A"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
                {discountPercent > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/products/edit/${product._id}`)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <PencilIcon className="w-4 h-4" /> Edit Product
            </button>
            <Link
              to={`${FRONTEND_URL}/product/${product.slug}`}
              target="_blank"
              className="btn-outline text-sm"
            >
              View in Store
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-primary border-t border-l border-r border-gray-100"
                : "text-text-light hover:text-text"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === "reviews" && reviews.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {reviews.length}
              </span>
            )}
            {tab.id === "orders" && productOrders.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {productOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "meta" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Product Meta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Name</p>
              <p className="font-medium">{product.name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">SKU</p>
              <p className="font-medium">{product.sku || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Original Price</p>
              <p className="font-medium">₹{product.price?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Discounted Price</p>
              <p className="font-medium text-green-600">
                {product.comparePrice
                  ? `₹${product.comparePrice.toLocaleString()}`
                  : "No discount"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Stock</p>
              <p className="font-medium">{product.stock || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Product Type</p>
              <p className="font-medium capitalize">{product.productType}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Gender</p>
              <p className="font-medium capitalize">
                {typeof product.gender === "string"
                  ? product.gender.split(",").join(", ")
                  : product.gender || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Frame Shape</p>
              <p className="font-medium">
                {typeof product.frameShape === "string"
                  ? product.frameShape.split(",").join(", ")
                  : product.frameShape || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Frame Material</p>
              <p className="font-medium">
                {typeof product.frameMaterial === "string"
                  ? product.frameMaterial.split(",").join(", ")
                  : product.frameMaterial || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Lens Type</p>
              <p className="font-medium">
                {typeof product.lensType === "string"
                  ? product.lensType.split(",").join(", ")
                  : product.lensType || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl col-span-2">
              <p className="text-xs text-text-light">Description</p>
              <p className="font-medium">
                {product.description || "No description"}
              </p>
            </div>
            {product.specifications?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                <p className="text-xs text-text-light mb-2">Specifications</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {product.specifications.map((spec, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-lg text-center"
                    >
                      <p className="text-xs text-text-light">{spec.name}</p>
                      <p className="font-medium text-sm">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Customer Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-text-light">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                      {review.user?.firstName?.[0]}
                      {review.user?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {review.user?.firstName} {review.user?.lastName}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                        <span className="text-xs text-text-light ml-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <p className="font-medium text-sm mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-text-light">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Customers Who Ordered ({productOrders.length})
          </h2>
          {productOrders.length === 0 ? (
            <p className="text-text-light">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {productOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-gray-50 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                    <p className="text-xs text-text-light">
                      Order #{order.orderNumber} •{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      Qty:{" "}
                      {order.items?.find(
                        (item) =>
                          item.product?._id === id || item.product === id,
                      )?.quantity || 0}
                    </p>
                    <p className="text-xs text-text-light">
                      ₹{order.total?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center py-16">
          <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-text-light">Analytics coming soon</p>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center py-16">
          <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-text-light">Activity log coming soon</p>
        </div>
      )}
    </div>
  );
};

export default ProductDetailView;
