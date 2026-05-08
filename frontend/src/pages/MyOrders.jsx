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
      } catch (error) {
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

  return (
    <>
      <SEO title="My Orders" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-text">My Orders</h1>
            <Link
              to="/account"
              className="text-primary hover:underline text-sm"
            >
              Back to Account
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
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
                <Link
                  key={order._id}
                  to={`/account/orders/${order._id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between mb-4">
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
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-700"}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text">
                        {order.items?.length} item(s)
                      </p>
                      <p className="text-sm text-text-light">
                        Payment: {order.isCOD ? "Cash on Delivery" : "Online"}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      ₹{order.total?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyOrders;
