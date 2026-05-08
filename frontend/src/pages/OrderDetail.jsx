import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const OrderDetail = () => {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/orders/${id}`);
      return data.order;
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

  return (
    <>
      <SEO title={`Order #${order.orderNumber}`} />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text">
                Order #{order.orderNumber}
              </h1>
              <p className="text-text-light mt-1">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${statusColors[order.orderStatus]}`}
            >
              {order.orderStatus}
            </span>
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
                        Qty: {item.quantity} x ₹{item.price?.toLocaleString()}
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
            <div>
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                <p className="font-medium">{order.shippingAddress?.fullName}</p>
                <p className="text-text-light text-sm">
                  {order.shippingAddress?.street}
                </p>
                <p className="text-text-light text-sm">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  {order.shippingAddress?.pincode}
                </p>
                <p className="text-text-light text-sm">
                  Phone: {order.shippingAddress?.phone}
                </p>
              </div>

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
                    <div className="flex justify-between">
                      <span className="text-green-600">Discount</span>
                      <span className="text-green-600">
                        -₹{order.discount?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{order.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-text-light">
                    Payment Method:{" "}
                    <span className="font-medium text-text">
                      {order.isCOD ? "Cash on Delivery" : "Online Payment"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
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
