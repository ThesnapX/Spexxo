import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeftIcon,
  UserIcon,
  ShoppingBagIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("meta");
  const [showOrderModal, setShowOrderModal] = useState(null);

  // Fetch user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users/${id}`);
      return data.user || null;
    },
    enabled: !!id,
  });

  // Fetch user orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-user-orders", id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/orders/admin/all?limit=100`,
        );
        return data.orders?.filter((order) => order.user?._id === id) || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Fetch ALL reviews and filter by user (since we don't have a direct endpoint)
  const { data: allReviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin-all-reviews-for-user"],
    queryFn: async () => {
      try {
        // First try to get all reviews from the all endpoint
        const { data } = await axios.get(`${API_URL}/reviews/all`);
        return data.reviews || [];
      } catch (error) {
        console.log("Falling back to fetching reviews by product...");
        // Fallback: fetch all products and their reviews
        try {
          const { data: productsData } = await axios.get(
            `${API_URL}/products?limit=100`,
          );
          const allReviews = [];

          for (const product of productsData.products || []) {
            try {
              const { data: reviewData } = await axios.get(
                `${API_URL}/reviews/${product._id}`,
              );
              if (reviewData.reviews && reviewData.reviews.length > 0) {
                // Add product info to each review
                const reviewsWithProduct = reviewData.reviews.map((r) => ({
                  ...r,
                  product: product,
                }));
                allReviews.push(...reviewsWithProduct);
              }
            } catch (e) {
              // Skip products with no reviews
            }
          }
          return allReviews;
        } catch (e) {
          return [];
        }
      }
    },
    enabled: !!id,
  });

  const user = userData;
  const orders = ordersData || [];
  // Filter reviews to only show those from this user
  const allReviews = allReviewsData || [];
  const reviews = allReviews.filter((review) => review.user?._id === id);

  const tabs = [
    { id: "meta", label: "User Meta", icon: ClipboardDocumentListIcon },
    { id: "orders", label: "Order History", icon: ShoppingBagIcon },
    { id: "reviews", label: "Reviews", icon: StarIcon },
  ];

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-light">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold">User Not Found</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="btn-primary mt-4 text-sm"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const handleViewOrder = (order) => {
    setShowOrderModal(order);
  };

  const closeOrderModal = () => {
    setShowOrderModal(null);
  };

  const handleViewProduct = (productId) => {
    if (productId) {
      navigate(`/admin/products/view/${productId}`);
    }
  };

  const handleViewOrderDetail = (orderId) => {
    if (orderId) {
      navigate(`/admin/orders/${orderId}`);
    }
  };

  const isLoading = userLoading || ordersLoading || reviewsLoading;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-text-light hover:text-primary transition mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back to Users
      </button>

      {/* User Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-text-light">
                <span>
                  Customer ID: <strong>{user.customerId || "N/A"}</strong>
                </span>
                <span>•</span>
                <span>
                  Username: <strong>@{user.username || "Not set"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive !== false
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.isActive !== false ? "Active" : "Inactive"}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                  {user.role || "Customer"}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/account`}
              target="_blank"
              className="btn-outline text-sm"
            >
              View as Customer
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
            {tab.id === "orders" && orders.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {orders.length}
              </span>
            )}
            {tab.id === "reviews" && reviews.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {reviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {/* META TAB */}
      {activeTab === "meta" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Full Name</p>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Email</p>
              <p className="font-medium flex items-center gap-2">
                {user.email}
                {user.isEmailVerified ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircleIcon className="w-4 h-4 text-red-500" />
                )}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Username</p>
              <p className="font-medium">@{user.username || "Not set"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Role</p>
              <p className="font-medium capitalize">
                {user.role || "Customer"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Status</p>
              <p
                className={`font-medium ${user.isActive !== false ? "text-green-600" : "text-red-600"}`}
              >
                {user.isActive !== false ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl col-span-2">
              <p className="text-xs text-text-light">Account Created</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
            {user.addresses?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                <p className="text-xs text-text-light mb-2">Saved Addresses</p>
                <div className="space-y-2">
                  {user.addresses.map((addr, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-primary" />
                        <p className="font-medium text-sm">
                          {addr.name || "Address"}
                        </p>
                        {addr.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-light mt-1">
                        {addr.fullName && `${addr.fullName}, `}
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        {addr.area && `, ${addr.area}`}
                        {addr.city && `, ${addr.city}`}
                        {addr.state && `, ${addr.state}`}
                        {addr.pincode && ` - ${addr.pincode}`}
                      </p>
                      <p className="text-xs text-text-light">
                        📞 {addr.phone || "No phone"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Order History ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-text-light text-center py-12">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => handleViewOrder(order)}
                  className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition cursor-pointer border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrderDetail(order._id);
                        }}
                        className="font-medium text-sm hover:text-primary hover:underline transition"
                      >
                        Order #{order.orderNumber}
                      </button>
                      <p className="text-xs text-text-light">
                        {new Date(order.createdAt).toLocaleDateString()} •{" "}
                        {order.items?.length || 0} items
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.orderStatus === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.orderStatus === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : order.orderStatus === "shipped"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.orderStatus?.toUpperCase() || "PENDING"}
                        </span>
                        <span className="text-xs text-text-light">
                          {order.paymentMethod === "online"
                            ? "💳 Online"
                            : "💵 COD"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text">
                        ₹{order.total?.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-light">
                        {order.paymentStatus === "paid"
                          ? "✅ Paid"
                          : "⏳ Pending"}
                      </p>
                    </div>
                  </div>
                  {/* Order Items Preview */}
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProduct(item.product?._id);
                        }}
                        className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border text-xs flex-shrink-0 hover:border-primary hover:bg-primary/5 transition"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-6 h-6 rounded object-cover"
                          />
                        ) : (
                          <PhotoIcon className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="truncate max-w-24">{item.name}</span>
                        <span className="text-text-light">
                          ×{item.quantity}
                        </span>
                      </button>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="text-xs text-text-light flex items-center">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB - FIXED */}
      {activeTab === "reviews" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Reviews by {user.firstName} ({reviews.length})
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-3 text-text-light">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-light">No reviews yet by this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <button
                        onClick={() => handleViewProduct(review.product?._id)}
                        className="font-medium text-sm hover:text-primary hover:underline transition"
                      >
                        {review.product?.name || "Product"}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) =>
                            i < review.rating ? (
                              <StarSolid
                                key={i}
                                className="w-3.5 h-3.5 text-yellow-400"
                              />
                            ) : (
                              <StarIcon
                                key={i}
                                className="w-3.5 h-3.5 text-gray-300"
                              />
                            ),
                          )}
                        </div>
                        <span className="text-xs text-text-light">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.isHidden ? (
                          <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                            Hidden
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Visible
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewProduct(review.product?._id)}
                      className="text-xs text-primary hover:underline"
                    >
                      View Product →
                    </button>
                  </div>
                  {review.title && (
                    <p className="font-medium text-sm mt-2">{review.title}</p>
                  )}
                  <p className="text-sm text-text-light mt-1">
                    {review.comment}
                  </p>
                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          alt="Review"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  )}
                  {review.adminReply && (
                    <div className="mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700">
                        Admin Reply
                      </p>
                      <p className="text-sm text-text mt-1">
                        {review.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeOrderModal}
          />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <button
              onClick={closeOrderModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-text mb-2">
              Order #{showOrderModal.orderNumber}
            </h2>
            <p className="text-sm text-text-light mb-4">
              Placed on {new Date(showOrderModal.createdAt).toLocaleString()}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Status</p>
                <p className="font-medium capitalize">
                  {showOrderModal.orderStatus}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Payment</p>
                <p className="font-medium">
                  {showOrderModal.paymentMethod?.toUpperCase()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                <p className="text-xs text-text-light">Total</p>
                <p className="font-bold text-lg">
                  ₹{showOrderModal.total?.toLocaleString()}
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-sm mb-2">Items</h3>
            <div className="space-y-2">
              {showOrderModal.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <PhotoIcon className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-text-light">
                      ×{item.quantity} @ ₹{item.price}
                    </p>
                  </div>
                  <p className="text-sm font-medium">₹{item.subtotal}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleViewOrderDetail(showOrderModal._id)}
              className="btn-primary text-sm w-full mt-4"
            >
              View Full Order Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailView;
