// frontend/src/pages/MyOrders.jsx

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MyOrders = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/orders/my-orders`);
        return data.orders;
      } catch {
        return [];
      }
    },
  });

  const orders = data || [];

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
    refunded: "bg-gray-100 text-gray-700",
  };

  return (
    <>
      <SEO title="My Orders" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-text">
              My Orders
            </h1>
            <Link
              to="/account"
              className="text-primary hover:underline text-sm"
            >
              Back to Account
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-6xl mb-4">📦</p>
              <h2 className="text-xl font-semibold text-text mb-2">
                No Orders Yet
              </h2>
              <p className="text-text-light mb-6">
                Start shopping to place your first order
              </p>
              <Link to="/shop" className="btn-primary">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm text-text-light">
                        Order #{order.orderNumber}
                      </p>
                      <p className="text-xs text-text-light">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-700"}`}
                      >
                        {order.orderStatus}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${paymentStatusColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}
                      >
                        {order.paymentStatus === "refund_pending"
                          ? "Refund Pending"
                          : order.paymentStatus === "refunded"
                            ? "Refunded"
                            : order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* ✅ Show items with variant details */}
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover border"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-text">
                                {item.name}
                              </p>
                              {item.variant?.name && (
                                <p className="text-xs text-primary font-medium">
                                  Variant: {item.variant.name}
                                  {item.variant?.color?.hexCode && (
                                    <span
                                      className="inline-block w-3 h-3 rounded-full ml-2 align-middle border"
                                      style={{
                                        backgroundColor:
                                          item.variant.color.hexCode,
                                      }}
                                    />
                                  )}
                                </p>
                              )}
                              {item.variant?.sku && (
                                <p className="text-xs text-text-light">
                                  SKU: {item.variant.sku}
                                </p>
                              )}
                              <p className="text-xs text-text-light">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-text">
                            ₹{item.price?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm text-text-light">
                          Payment:{" "}
                          {order.isCOD
                            ? "Cash on Delivery"
                            : "Online (Razorpay)"}
                        </p>
                        {order.isCOD && order.codAdvance > 0 && (
                          <p className="text-xs text-orange-600">
                            10% advance paid: ₹
                            {order.codAdvance?.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-bold text-primary">
                          ₹{order.total?.toLocaleString()}
                        </p>
                        <Link
                          to={`/account/orders/${order._id}`}
                          className="btn-outline text-xs py-2 px-4"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyOrders;
