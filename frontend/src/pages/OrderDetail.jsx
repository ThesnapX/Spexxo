import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/orders/${id}`);
      return data.order;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await axios.put(`${API_URL}/orders/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Order cancelled successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    },
  });

  if (isLoading) {
    return (
      <div className="pt-28 pb-16">
        <div className="container-custom text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-28 pb-16">
        <div className="container-custom text-center py-20">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <Link
            to="/account/orders"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const paymentStatusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refund_pending: "bg-orange-100 text-orange-700",
  };

  const canCancel = ["pending", "confirmed"].includes(order.orderStatus);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelMutation.mutate();
    }
  };

  return (
    <>
      <SEO title={`Order #${order.orderNumber}`} />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text">
                Order #{order.orderNumber}
              </h1>
              <p className="text-text-light mt-1 flex items-center gap-2 flex-wrap">
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span>•</span>
                <span>
                  {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${statusColors[order.orderStatus]}`}
              >
                {order.orderStatus}
              </span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${paymentStatusColors[order.paymentStatus]}`}
              >
                {order.paymentStatus}
              </span>
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Items */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Items</h2>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/images/products/placeholder.jpg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text">{item.name}</p>
                      {item.variant?.name && (
                        <p className="text-xs text-text-light">
                          {item.variant.name}
                        </p>
                      )}
                      <p className="text-sm text-text-light">
                        Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{item.subtotal?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                <p className="font-medium">{order.shippingAddress?.fullName}</p>
                <p className="text-text-light text-sm">
                  {order.shippingAddress?.addressLine1}
                </p>
                {order.shippingAddress?.addressLine2 && (
                  <p className="text-text-light text-sm">
                    {order.shippingAddress.addressLine2}
                  </p>
                )}
                {order.shippingAddress?.landmark && (
                  <p className="text-text-light text-sm">
                    Landmark: {order.shippingAddress.landmark}
                  </p>
                )}
                {order.shippingAddress?.area && (
                  <p className="text-text-light text-sm">
                    Area: {order.shippingAddress.area}
                  </p>
                )}
                <p className="text-text-light text-sm">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  {order.shippingAddress?.pincode}
                </p>
                <p className="text-text-light text-sm">
                  Phone: {order.shippingAddress?.phone}
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-light">Method</span>
                    <span className="font-medium text-text uppercase">
                      {order.paymentMethod === "online"
                        ? "Online Payment"
                        : "Cash on Delivery"}
                      {order.isCOD &&
                        order.codAdvance > 0 &&
                        " (10% Advance + COD)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light">Status</span>
                    <span
                      className={`font-medium ${paymentStatusColors[order.paymentStatus]}`}
                    >
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                  </div>
                  {order.paymentDetails?.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-text-light">Transaction ID</span>
                      <span className="font-medium text-text font-mono text-xs">
                        {order.paymentDetails.transactionId}
                      </span>
                    </div>
                  )}
                  {order.paymentDetails?.paymentGateway && (
                    <div className="flex justify-between">
                      <span className="text-text-light">Gateway</span>
                      <span className="font-medium text-text">
                        {order.paymentDetails.paymentGateway.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {order.paymentDetails?.razorpayOrderId && (
                    <div className="flex justify-between">
                      <span className="text-text-light">Razorpay Order ID</span>
                      <span className="font-medium text-text font-mono text-xs">
                        {order.paymentDetails.razorpayOrderId}
                      </span>
                    </div>
                  )}
                  {order.isCOD && order.codAdvance > 0 && (
                    <>
                      <div className="flex justify-between text-orange-600">
                        <span>Advance Paid (10%)</span>
                        <span>-₹{order.codAdvance?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-light">Remaining COD</span>
                        <span className="font-medium text-text">
                          ₹{order.remainingCOD?.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4">Price Breakdown</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-light">Subtotal</span>
                    <span>₹{order.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light">Shipping</span>
                    <span>
                      {order.shippingCost === 0
                        ? "FREE"
                        : `₹${order.shippingCost}`}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{order.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  {order.coupon?.code && (
                    <div className="flex justify-between">
                      <span className="text-text-light">Coupon</span>
                      <span className="font-medium">{order.coupon.code}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{order.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {order.statusHistory?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
                  <div className="space-y-3">
                    {order.statusHistory.map((history, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === order.statusHistory.length - 1
                                ? "bg-primary"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          {index < order.statusHistory.length - 1 && (
                            <div className="w-0.5 h-6 bg-gray-300"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text capitalize">
                            {history.status}
                          </p>
                          <p className="text-text-light text-xs">
                            {new Date(history.date).toLocaleString()}
                          </p>
                          {history.note && (
                            <p className="text-text-light text-xs mt-0.5">
                              {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link to="/account/orders" className="text-primary hover:underline">
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
