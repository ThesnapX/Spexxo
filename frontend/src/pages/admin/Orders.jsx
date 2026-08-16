import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Orders = () => {
  const navigate = useNavigate();
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

  const orders = data?.orders || [];

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    shipped: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusIcons = {
    pending: <ArrowPathIcon className="w-3.5 h-3.5" />,
    confirmed: <CheckCircleIcon className="w-3.5 h-3.5" />,
    processing: <TruckIcon className="w-3.5 h-3.5" />,
    shipped: <TruckIcon className="w-3.5 h-3.5" />,
    delivered: <CheckCircleIcon className="w-3.5 h-3.5" />,
    cancelled: <XCircleIcon className="w-3.5 h-3.5" />,
  };

  const statusOptions = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Orders</h1>
          <p className="text-sm text-text-light mt-1">
            {orders.length} orders found
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
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
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-text-light">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-text-light">
                    <div className="flex flex-col items-center gap-2">
                      <TruckIcon className="w-12 h-12 text-gray-300" />
                      <p className="font-medium">No orders found</p>
                      <p className="text-sm">
                        Orders will appear here once customers place them
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => handleViewOrder(order._id)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
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
                        {order.shippingAddress?.city || "N/A"}
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
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.isCOD
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {order.isCOD ? "COD" : "Online"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1 w-fit ${statusColors[order.orderStatus]}`}
                      >
                        {statusIcons[order.orderStatus]}
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-text-light">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewOrder(order._id)}
                          className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
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
    </div>
  );
};

export default Orders;
