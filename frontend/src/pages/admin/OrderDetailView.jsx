// frontend/src/pages/admin/OrderDetailView.jsx

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
  PhotoIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  ReceiptRefundIcon,
  PencilIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const OrderDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");

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
      setStatusNote("");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update order status",
      );
      setUpdatingStatus(false);
    },
  });

  // Mark refund as completed
  const refundMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.put(`${API_URL}/orders/${id}/refund`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", id] });
      toast.success("Refund marked as completed!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to mark refund");
    },
  });

  const order = orderData;
  const user = order?.user;

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700",
      icon: ClockIcon,
    },
    {
      value: "confirmed",
      label: "Confirmed",
      color: "bg-blue-100 text-blue-700",
      icon: CheckCircleIcon,
    },
    {
      value: "processing",
      label: "Processing",
      color: "bg-indigo-100 text-indigo-700",
      icon: TruckIcon,
    },
    {
      value: "shipped",
      label: "Shipped",
      color: "bg-purple-100 text-purple-700",
      icon: TruckIcon,
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-700",
      icon: CheckCircleIcon,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-700",
      icon: XCircleIcon,
    },
  ];

  const paymentStatusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refund_pending: "bg-orange-100 text-orange-700",
    refunded: "bg-gray-100 text-gray-700",
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find((s) => s.value === status);
    return option || statusOptions[0];
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === order?.orderStatus) return;

    setUpdatingStatus(true);
    await updateStatusMutation.mutateAsync({
      status: newStatus,
      note: statusNote || undefined,
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
    let phone = order?.shippingAddress?.phone || user?.phone || "";
    phone = phone.replace(/[\s\-\(\)\+]/g, "");
    if (phone.startsWith("0")) phone = phone.substring(1);
    if (!phone.startsWith("91") && phone.length === 10) phone = "91" + phone;

    if (!phone || phone.length < 10) {
      toast.error("No valid phone number found for WhatsApp");
      return;
    }

    const customerName =
      order?.shippingAddress?.fullName || user?.firstName || "Customer";
    const message =
      `Hi *${customerName}*,\\n\\n` +
      `Your order *#${order?.orderNumber}* status has been updated to *${order?.orderStatus?.toUpperCase()}*.\\n\\n` +
      `*Order Details:*\\n` +
      `• Total: ₹${order?.total?.toLocaleString()}\\n` +
      `• Payment: ${order?.paymentMethod?.toUpperCase()}\\n` +
      `• Status: ${order?.orderStatus?.toUpperCase()}\\n\\n` +
      `Thank you for shopping with Spexxo!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
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
  const StatusIcon = statusInfo.icon;

  // Get customer full name
  const customerName = user?.firstName || order?.user?.firstName || "N/A";
  const customerLastName = user?.lastName || order?.user?.lastName || "";
  const customerFullName =
    `${customerName} ${customerLastName}`.trim() || "N/A";

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/orders")}
        className="flex items-center gap-2 text-text-light hover:text-primary transition mb-4 text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Orders
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
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label.toUpperCase()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}
              >
                {order.paymentStatus === "refund_pending"
                  ? "REFUND PENDING"
                  : order.paymentStatus === "refunded"
                    ? "REFUNDED"
                    : order.paymentStatus?.toUpperCase()}
              </span>
              {order.isCOD && order.codAdvance > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  COD (10% Advance)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-light flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <button
                  onClick={() => handleViewUser(order.user?._id)}
                  className="hover:text-primary hover:underline transition"
                >
                  {customerFullName}
                </button>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleWhatsAppClick}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition flex items-center gap-1"
            >
              💬 WhatsApp
            </button>
            <Link
              to={`/account/orders/${order._id}`}
              target="_blank"
              className="btn-outline text-sm"
            >
              View as Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Update Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-primary" />
              Update Order Status
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
              <input
                type="text"
                placeholder="Add a note (optional)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              {updatingStatus && (
                <span className="text-sm text-text-light flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block"></span>
                  Updating...
                </span>
              )}
            </div>

            {/* Status Timeline */}
            {order.statusHistory?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-text-light mb-2">Status History</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {order.statusHistory.map((history, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-text-light text-xs whitespace-nowrap">
                        {new Date(history.date).toLocaleString()}
                      </span>
                      <span className="text-text font-medium">→</span>
                      <span className="text-text font-medium capitalize">
                        {history.status === "refunded"
                          ? "Refunded"
                          : history.status}
                      </span>
                      {history.note && (
                        <span className="text-text-light text-xs truncate">
                          ({history.note})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5 text-primary" />
              Order Items ({order.items?.length || 0})
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
                      {item.variant?.name && (
                        <p className="text-xs text-primary font-medium">
                          Variant: {item.variant.name}
                          {item.variant?.color?.hexCode && (
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full ml-1.5 align-middle border"
                              style={{
                                backgroundColor: item.variant.color.hexCode,
                              }}
                            />
                          )}
                        </p>
                      )}
                      <p className="text-xs text-text-light">
                        SKU: {item.variant?.sku || item.product?.sku || "N/A"} •
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </button>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-text">
                      ₹{item.price?.toLocaleString()}
                    </p>
                    <p className="text-xs text-text-light">
                      Subtotal: ₹{item.subtotal?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Payment Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-primary" />
              Payment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Payment Method</p>
                <p className="font-medium text-text uppercase">
                  {order.paymentMethod === "online"
                    ? "Online Payment"
                    : "Cash on Delivery"}
                  {isCOD && order.codAdvance > 0 && " (10% Advance + COD)"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Payment Status</p>
                <span
                  className={`font-medium ${paymentStatusColors[order.paymentStatus]}`}
                >
                  {order.paymentStatus === "refund_pending"
                    ? "Refund Pending"
                    : order.paymentStatus === "refunded"
                      ? "Refunded"
                      : order.paymentStatus?.toUpperCase()}
                </span>
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                  <p className="text-xs text-text-light">Transaction ID</p>
                  <p className="font-medium text-text font-mono text-xs break-all">
                    {order.paymentDetails.transactionId}
                  </p>
                </div>
              )}
              {order.paymentDetails?.paymentGateway && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-text-light">Gateway</p>
                  <p className="font-medium text-text capitalize">
                    {order.paymentDetails.paymentGateway}
                  </p>
                </div>
              )}
              {order.paymentDetails?.razorpayOrderId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-text-light">Razorpay Order ID</p>
                  <p className="font-medium text-text font-mono text-xs break-all">
                    {order.paymentDetails.razorpayOrderId}
                  </p>
                </div>
              )}
              {isCOD && order.codAdvance > 0 && (
                <>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-orange-600">Advance Amount</p>
                    <p className="font-medium text-orange-700">
                      ₹{order.codAdvance?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-text-light">COD Amount</p>
                    <p className="font-medium text-text">
                      ₹{order.remainingCOD?.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Refund Section */}
            {order.paymentStatus === "refund_pending" && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <ReceiptRefundIcon className="w-5 h-5" />
                      Refund Pending
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Amount to refund: ₹
                      {(
                        order.refundAmount ||
                        order.codAdvance ||
                        order.total ||
                        0
                      ).toLocaleString()}
                    </p>
                    {order.codAdvance > 0 && (
                      <p className="text-xs text-orange-500 mt-0.5">
                        (Advance payment: ₹{order.codAdvance.toLocaleString()})
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Mark this refund as completed?")) {
                        refundMutation.mutate();
                      }
                    }}
                    disabled={refundMutation.isPending}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {refundMutation.isPending
                      ? "Processing..."
                      : "Mark as Refunded"}
                  </button>
                </div>
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Make sure to process the actual refund in Razorpay
                  dashboard first.
                </p>
              </div>
            )}
          </div>

          {/* 4. Order Meta */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
              Order Meta
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Order ID</p>
                <p className="font-medium text-text font-mono text-xs break-all">
                  {order._id}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Order Number</p>
                <p className="font-medium text-text">#{order.orderNumber}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Created At</p>
                <p className="font-medium text-text text-sm">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Last Updated</p>
                <p className="font-medium text-text text-sm">
                  {new Date(order.updatedAt).toLocaleString()}
                </p>
              </div>
              {order.trackingNumber && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-text-light">Tracking Number</p>
                  <p className="font-medium text-text">
                    {order.trackingNumber}
                  </p>
                </div>
              )}
              {order.notes && (
                <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                  <p className="text-xs text-text-light">Notes</p>
                  <p className="font-medium text-text text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - 1/3 - Customer Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Customer Info
            </h2>

            {/* Customer Avatar & Name */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0">
                {customerName?.[0] || "C"}
                {customerLastName?.[0] || ""}
              </div>
              <div>
                <button
                  onClick={() => handleViewUser(order.user?._id)}
                  className="font-semibold text-text hover:text-primary hover:underline transition"
                >
                  {customerFullName}
                </button>
                <p className="text-xs text-text-light">
                  Customer ID: {user?.customerId || "N/A"}
                </p>
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                <EnvelopeIcon className="w-4 h-4 text-text-light flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-light">Email</p>
                  <p className="text-sm font-medium text-text break-all">
                    {user?.email || order?.user?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                <PhoneIcon className="w-4 h-4 text-text-light flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-light">Phone</p>
                  <p className="text-sm font-medium text-text">
                    {user?.phone || order?.user?.phone || "N/A"}
                  </p>
                </div>
              </div>

              {user?.username && (
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                  <TagIcon className="w-4 h-4 text-text-light flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-light">Username</p>
                    <p className="text-sm font-medium text-text">
                      @{user.username}
                    </p>
                  </div>
                </div>
              )}

              {user?.role && (
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                  <BuildingOfficeIcon className="w-4 h-4 text-text-light flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-light">Role</p>
                    <p className="text-sm font-medium text-text capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                <CalendarIcon className="w-4 h-4 text-text-light flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-light">Account Created</p>
                  <p className="text-sm font-medium text-text">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* View Customer Button */}
            <button
              onClick={() => handleViewUser(order.user?._id)}
              className="w-full mt-4 py-2.5 bg-[#EBF4FC] text-primary rounded-lg text-sm font-medium hover:bg-[#D6E8F7] transition flex items-center justify-center gap-1"
            >
              <UserIcon className="w-4 h-4" />
              View Full Customer Profile
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-primary" />
              Shipping Address
            </h2>
            {order.shippingAddress ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <HomeIcon className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text">
                      {order.shippingAddress.fullName || "N/A"}
                    </p>
                    {order.shippingAddress.phone && (
                      <p className="text-sm text-text-light flex items-center gap-1">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        {order.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pl-6 space-y-0.5 text-sm text-text-light">
                  <p>{order.shippingAddress.addressLine1 || "N/A"}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  {order.shippingAddress.landmark && (
                    <p>Landmark: {order.shippingAddress.landmark}</p>
                  )}
                  {order.shippingAddress.area && (
                    <p>Area: {order.shippingAddress.area}</p>
                  )}
                  <p>
                    {order.shippingAddress.city || "N/A"},{" "}
                    {order.shippingAddress.state || "N/A"} -{" "}
                    {order.shippingAddress.pincode || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-text-light text-sm">
                No shipping address available
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <CurrencyRupeeIcon className="w-5 h-5 text-primary" />
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-light">Subtotal</span>
                <span className="font-medium text-text">
                  ₹{order.subtotal?.toLocaleString() || "0"}
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
                  {order.shippingCost === 0
                    ? "Free"
                    : `₹${order.shippingCost?.toLocaleString()}`}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-text">Total</span>
                <span className="font-bold text-xl text-primary">
                  ₹{order.total?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailView;
