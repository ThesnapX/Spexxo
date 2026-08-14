import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Orders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await axios.get(`${API_URL}/orders/admin/all?${params}`);
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }) => {
      await axios.put(`${API_URL}/orders/${id}/status`, { status, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated!");
      setSelectedOrder(null);
    },
  });

  const orders = data?.orders || [];

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusOptions = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({
      id: orderId,
      status: newStatus,
      note: `Status changed to ${newStatus}`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">All Orders</option>
          {statusOptions.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Order
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Customer
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Items
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Total
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Payment
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Date
                </th>
                <th className="text-right p-4 text-sm font-medium text-text-light">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-text-light">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium text-sm text-text">
                        #{order.orderNumber}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium">
                        {order.user?.firstName} {order.user?.lastName}
                      </p>
                      <p className="text-xs text-text-light">
                        {order.shippingAddress?.city}
                      </p>
                    </td>
                    <td className="p-4 text-sm">
                      {order.items?.length || 0} items
                    </td>
                    <td className="p-4 text-sm font-semibold">
                      ₹{order.total?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${order.isCOD ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {order.isCOD ? "COD" : "Online"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.orderStatus]}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-text-light">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                Order #{selectedOrder.orderNumber}
              </h2>
              <button onClick={() => setSelectedOrder(null)}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-light">Customer</p>
                  <p className="font-medium">
                    {selectedOrder.user?.firstName}{" "}
                    {selectedOrder.user?.lastName}
                  </p>
                  <p className="text-sm text-text-light">
                    {selectedOrder.user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-light">Order Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-text-light mb-2">Shipping Address</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium">
                    {selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                  <p>
                    {selectedOrder.shippingAddress?.city},{" "}
                    {selectedOrder.shippingAddress?.state} -{" "}
                    {selectedOrder.shippingAddress?.pincode}
                  </p>
                  <p>📞 {selectedOrder.shippingAddress?.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-text-light mb-2">Items</p>
                {selectedOrder.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2 border-b text-sm"
                  >
                    <span>
                      {item.product?.slug ? (
                        <Link
                          to={`/product/${item.product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}{" "}
                      × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ₹{item.subtotal?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>₹{selectedOrder.total?.toLocaleString()}</span>
              </div>

              <div>
                <p className="text-xs text-text-light mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        handleStatusUpdate(selectedOrder._id, status)
                      }
                      disabled={selectedOrder.orderStatus === status}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${
                        selectedOrder.orderStatus === status
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-[#EBF4FC] text-[#3D96EB] hover:bg-primary hover:text-white"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
