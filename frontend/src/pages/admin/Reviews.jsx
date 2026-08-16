import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  StarIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Reviews = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReview, setExpandedReview] = useState(null);

  // Fetch all products first
  const { data: productsData } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=200`);
      return data.products || [];
    },
  });

  // Fetch reviews - Try /all endpoint first
  const {
    data: reviewsData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["admin-all-reviews"],
    queryFn: async () => {
      try {
        // First try the /all endpoint
        const { data } = await axios.get(`${API_URL}/reviews/all`);
        console.log("Reviews from /all endpoint:", data.reviews?.length || 0);
        return data.reviews || [];
      } catch (err) {
        console.log("/all endpoint failed, falling back to product-by-product");
        // Fallback: fetch all products and their reviews
        const products = productsData || [];
        const allReviews = [];

        for (const product of products) {
          try {
            const { data: reviewData } = await axios.get(
              `${API_URL}/reviews/${product._id}`,
            );
            if (reviewData.reviews && reviewData.reviews.length > 0) {
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
        console.log("Reviews from fallback:", allReviews.length);
        return allReviews;
      }
    },
    enabled: true,
    retry: 1,
  });

  // Apply filters
  const reviews = (reviewsData || []).filter((review) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        review.user?.firstName?.toLowerCase().includes(searchLower) ||
        review.user?.lastName?.toLowerCase().includes(searchLower) ||
        review.product?.name?.toLowerCase().includes(searchLower) ||
        review.comment?.toLowerCase().includes(searchLower) ||
        review.title?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Product filter
    if (selectedProduct && review.product?._id !== selectedProduct) {
      return false;
    }

    // Rating filter
    if (selectedRating && (review.rating || 0) < parseInt(selectedRating)) {
      return false;
    }

    // Status filter
    if (selectedStatus === "hidden" && !review.isHidden) return false;
    if (selectedStatus === "visible" && review.isHidden) return false;

    return true;
  });

  // Get unique products for filter dropdown
  const uniqueProducts = (reviewsData || [])
    .filter((r) => r.product)
    .reduce((acc, review) => {
      if (!acc.find((p) => p._id === review.product._id)) {
        acc.push(review.product);
      }
      return acc;
    }, []);

  // Toggle review visibility
  const toggleReviewMutation = useMutation({
    mutationFn: async ({ reviewId, isHidden }) => {
      await axios.put(`${API_URL}/reviews/${reviewId}/toggle`, { isHidden });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-reviews"] });
      toast.success("Review visibility updated!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update review");
    },
  });

  // Delete review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      await axios.delete(`${API_URL}/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-reviews"] });
      toast.success("Review deleted!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete review");
    },
  });

  // Reply to review
  const replyReviewMutation = useMutation({
    mutationFn: async ({ reviewId, reply }) => {
      await axios.put(`${API_URL}/reviews/${reviewId}/reply`, { reply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-reviews"] });
      toast.success("Reply added!");
      setReplyingTo(null);
      setReplyText("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add reply");
    },
  });

  const handleToggleReview = (reviewId, currentHidden) => {
    if (
      window.confirm(
        currentHidden
          ? "Make this review visible to customers?"
          : "Hide this review from customers?",
      )
    ) {
      toggleReviewMutation.mutate({ reviewId, isHidden: !currentHidden });
    }
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const handleReplySubmit = (reviewId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    replyReviewMutation.mutate({ reviewId, reply: replyText });
  };

  const handleViewUser = (userId) => {
    if (userId) {
      navigate(`/admin/users/${userId}`);
    }
  };

  const handleViewProduct = (productId) => {
    if (productId) {
      navigate(`/admin/products/view/${productId}`);
    }
  };

  const clearFilters = () => {
    setSelectedProduct("");
    setSelectedRating("");
    setSelectedStatus("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedProduct || selectedRating || selectedStatus || searchQuery;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">All Reviews</h1>
          <p className="text-sm text-text-light mt-1">
            {reviews.length} reviews found
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="btn-outline text-sm flex items-center gap-1"
            disabled={isLoading}
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-1"
          >
            <FunnelIcon className="w-4 h-4" />{" "}
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, product name, or review content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-text-light mb-1">
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Products</option>
                {uniqueProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Rating
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Ratings</option>
                <option value="5">⭐ 5 Stars</option>
                <option value="4">⭐ 4 Stars & Up</option>
                <option value="3">⭐ 3 Stars & Up</option>
                <option value="2">⭐ 2 Stars & Up</option>
                <option value="1">⭐ 1 Star</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:underline mt-3"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Debug info - remove after testing */}
      {!isLoading && reviewsData && (
        <div className="text-xs text-text-light mb-2">
          Total reviews fetched: {reviewsData.length} | Filtered:{" "}
          {reviews.length}
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="mt-3 h-4 bg-gray-200 rounded w-full" />
              <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Reviews Found
          </h3>
          <p className="text-text-light mb-6 text-sm">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "No reviews have been submitted yet"}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-outline text-sm">
              Clear Filters
            </button>
          )}
          {!hasActiveFilters && (
            <button onClick={() => refetch()} className="btn-outline text-sm">
              Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className={`bg-white rounded-xl border p-4 ${
                review.isHidden
                  ? "border-gray-300 opacity-60"
                  : "border-gray-100"
              }`}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {review.user?.firstName?.[0]}
                    {review.user?.lastName?.[0]}
                  </div>
                  <div>
                    <button
                      onClick={() => handleViewUser(review.user?._id)}
                      className="font-medium text-sm hover:text-primary hover:underline transition flex items-center gap-1"
                    >
                      {review.user?.firstName} {review.user?.lastName}
                      <UserIcon className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
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
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
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
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handleToggleReview(review._id, review.isHidden)
                    }
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition"
                    title={review.isHidden ? "Show" : "Hide"}
                  >
                    {review.isHidden ? (
                      <EyeIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 transition text-red-500"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Product Link */}
              {review.product && (
                <button
                  onClick={() => handleViewProduct(review.product._id)}
                  className="text-xs text-primary hover:underline mt-1 block"
                >
                  📦 {review.product.name || "Product"}
                </button>
              )}

              {/* Review Content */}
              <div className="mt-2">
                {review.title && (
                  <p className="font-medium text-sm">{review.title}</p>
                )}
                <p
                  className={`text-sm text-text-light mt-1 ${expandedReview === review._id ? "" : "line-clamp-2"}`}
                >
                  {review.comment}
                </p>
                {review.comment && review.comment.length > 100 && (
                  <button
                    onClick={() =>
                      setExpandedReview(
                        expandedReview === review._id ? null : review._id,
                      )
                    }
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    {expandedReview === review._id ? "Show less" : "Show more"}
                  </button>
                )}
              </div>

              {/* Review Images */}
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

              {/* Admin Reply */}
              {review.adminReply ? (
                <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <ChatBubbleLeftIcon className="w-3.5 h-3.5" /> Admin Reply
                  </p>
                  <p className="text-sm text-text mt-1">{review.adminReply}</p>
                </div>
              ) : (
                <div className="mt-3">
                  {replyingTo === review._id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReplySubmit(review._id)}
                        className="btn-primary text-sm py-1.5 px-3"
                        disabled={replyReviewMutation.isPending}
                      >
                        {replyReviewMutation.isPending ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"></span>
                        ) : (
                          "Reply"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        className="btn-outline text-sm py-1.5 px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review._id)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ChatBubbleLeftIcon className="w-3.5 h-3.5" /> Reply to
                      Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
