import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  UserIcon,
  ShoppingBagIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid,
  PhotoIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ReceiptRefundIcon,
  TagIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const OrderDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");

  // Fetch order
  const {
    data: orderData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/orders/${id}`);
      return data.order || null;
    },
    enabled: !!id,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }) => {
      const { data } = await axios.put(`${API_URL}/orders/${id}/status`, {
        status,
        note,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Order status updated to ${data.order.orderStatus}!`);
      refetch();
      setUpdatingStatus(false);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update order status",
      );
      setUpdatingStatus(false);
    },
  });

  const order = orderData;

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      value: "confirmed",
      label: "Confirmed",
      color: "bg-blue-100 text-blue-700",
    },
    {
      value: "processing",
      label: "Processing",
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      value: "shipped",
      label: "Shipped",
      color: "bg-purple-100 text-purple-700",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-700",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-700",
    },
  ];

  const getStatusBadge = (status) => {
    const option = statusOptions.find((s) => s.value === status);
    return option || statusOptions[0];
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === order?.orderStatus) return;

    const note = prompt(`Enter a note for this status change (optional):`);
    if (note === null) return;

    setUpdatingStatus(true);
    await updateStatusMutation.mutateAsync({
      status: newStatus,
      note: note || undefined,
    });
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

  const handleWhatsAppClick = () => {
    const phone = order?.shippingAddress?.phone || order?.user?.phone;
    if (!phone) {
      toast.error("No phone number found for WhatsApp");
      return;
    }

    const message =
      `Hi *${order?.shippingAddress?.fullName || order?.user?.firstName || "Customer"}*,\n\n` +
      `Your order *#${order?.orderNumber}* status has been updated to *${order?.orderStatus?.toUpperCase()}*.\n\n` +
      `📦 Order Details:\n` +
      `• Total: ₹${order?.total?.toLocaleString()}\n` +
      `• Payment: ${order?.paymentMethod?.toUpperCase()}\n` +
      `• Status: ${order?.orderStatus?.toUpperCase()}\n\n` +
      `Thank you for shopping with Spexxo! 👓`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${phone}?text=${encodedMessage}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-light">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold">Order Not Found</p>
        <button
          onClick={() => navigate("/admin/orders")}
          className="btn-primary mt-4 text-sm"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.orderStatus);
  const isCOD = order.paymentMethod === "cod";

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/orders")}
        className="flex items-center gap-2 text-text-light hover:text-primary transition mb-4"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back to Orders
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
              >
                {statusInfo.label.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-light">
              <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <button
                  onClick={() => handleViewUser(order.user?._id)}
                  className="hover:text-primary hover:underline transition"
                >
                  {order.user?.firstName} {order.user?.lastName}
                </button>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/account/orders/${order._id}`}
              target="_blank"
              className="btn-outline text-sm"
            >
              View as Customer
            </Link>
            {order.shippingAddress?.phone && (
              <button
                onClick={handleWhatsAppClick}
                className="btn-primary text-sm bg-green-500 hover:bg-green-600 border-0"
              >
                💬 WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4">
              Update Status
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={order.orderStatus}
                onChange={handleStatusChange}
                disabled={updatingStatus}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white min-w-[180px]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {updatingStatus && (
                <span className="text-sm text-text-light">Updating...</span>
              )}
              <span className="text-xs text-text-light ml-2">
                Current:{" "}
                <span className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </span>
            </div>
            {order.statusHistory?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-text-light mb-2">Status History</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {order.statusHistory.map((history, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-text-light">
                        {new Date(history.date).toLocaleString()}
                      </span>
                      <span className="text-text font-medium">→</span>
                      <span className="text-text">
                        {history.status.toUpperCase()}
                      </span>
                      {history.note && (
                        <span className="text-text-light text-xs">
                          ({history.note})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5" /> Order Items (
              {order.items?.length || 0})
            </h2>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition"
                >
                  <button
                    onClick={() => handleViewProduct(item.product?._id)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text hover:text-primary truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-light">
                        SKU: {item.variant?.sku || "N/A"} • Qty: {item.quantity}
                      </p>
                    </div>
                  </button>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-text">
                      ₹{item.price?.toLocaleString()}
                    </p>
                    <p className="text-xs text-text-light">
                      ₹{item.subtotal?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Subtotal</span>
                <span className="font-medium text-text">
                  ₹{order.subtotal?.toLocaleString()}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount?.toLocaleString()}</span>
                </div>
              )}
              {order.coupon?.code && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Coupon</span>
                  <span className="font-medium text-text">
                    {order.coupon.code}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Shipping</span>
                <span className="font-medium text-text">
                  ₹{order.shippingCost?.toLocaleString()}
                </span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Tax</span>
                  <span className="font-medium text-text">
                    ₹{order.tax?.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-text">Total</span>
                <span className="font-bold text-xl text-text">
                  ₹{order.total?.toLocaleString()}
                </span>
              </div>
              {isCOD && order.codAdvance > 0 && (
                <>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Advance Paid (10%)</span>
                    <span>-₹{order.codAdvance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Remaining COD</span>
                    <span className="font-medium text-text">
                      ₹{order.remainingCOD?.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5" /> Payment Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Method</span>
                <span className="font-medium text-text uppercase">
                  {order.paymentMethod}
                  {isCOD && order.codAdvance > 0 && " (10% Advance + COD)"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Status</span>
                <span
                  className={`font-medium ${
                    order.paymentStatus === "paid"
                      ? "text-green-600"
                      : order.paymentStatus === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {order.paymentStatus?.toUpperCase()}
                </span>
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Transaction ID</span>
                  <span className="font-medium text-text font-mono text-xs">
                    {order.paymentDetails.transactionId}
                  </span>
                </div>
              )}
              {order.paymentDetails?.paymentGateway && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Gateway</span>
                  <span className="font-medium text-text">
                    {order.paymentDetails.paymentGateway.toUpperCase()}
                  </span>
                </div>
              )}
              {order.paymentDetails?.razorpayOrderId && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Razorpay Order ID</span>
                  <span className="font-medium text-text font-mono text-xs">
                    {order.paymentDetails.razorpayOrderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5" /> Shipping Address
            </h2>
            {order.shippingAddress ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-text">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-text-light">
                  {order.shippingAddress.addressLine1}
                </p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-text-light">
                    {order.shippingAddress.addressLine2}
                  </p>
                )}
                {order.shippingAddress.landmark && (
                  <p className="text-text-light">
                    Landmark: {order.shippingAddress.landmark}
                  </p>
                )}
                {order.shippingAddress.area && (
                  <p className="text-text-light">
                    Area: {order.shippingAddress.area}
                  </p>
                )}
                <p className="text-text-light">
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.phone && (
                  <p className="text-text-light flex items-center gap-1">
                    <PhoneIcon className="w-3.5 h-3.5" />{" "}
                    {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-light text-sm">
                No shipping address available
              </p>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" /> Customer Info
            </h2>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => handleViewUser(order.user?._id)}
                className="font-medium text-text hover:text-primary hover:underline transition flex items-center gap-1"
              >
                {order.user?.firstName} {order.user?.lastName}
                <UserIcon className="w-3.5 h-3.5" />
              </button>
              <p className="text-text-light flex items-center gap-1">
                <EnvelopeIcon className="w-3.5 h-3.5" /> {order.user?.email}
              </p>
              {order.user?.phone && (
                <p className="text-text-light flex items-center gap-1">
                  <PhoneIcon className="w-3.5 h-3.5" /> {order.user.phone}
                </p>
              )}
              <p className="text-text-light text-xs">
                Customer ID: {order.user?.customerId || "N/A"}
              </p>
            </div>
          </div>

          {/* Order Meta */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-5 h-5" /> Order Meta
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">Order ID</span>
                <span className="font-medium text-text font-mono text-xs">
                  {order._id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">Order Number</span>
                <span className="font-medium text-text">
                  #{order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">Created</span>
                <span className="text-text">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">Last Updated</span>
                <span className="text-text">
                  {new Date(order.updatedAt).toLocaleString()}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-text-light">Tracking</span>
                  <span className="font-medium text-text">
                    {order.trackingNumber}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-text-light text-xs">Notes</p>
                  <p className="text-text text-sm mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;
