import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Dashboard = () => {
  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders-all"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/orders/admin/all?limit=100`);
      return data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=100`);
      return data;
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users`);
      return data;
    },
  });

  const orders = ordersData?.orders || [];
  const products = productsData?.products || [];
  const users = usersData?.users || [];

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalProducts = products.length;
  const totalUsers = users?.length || 0;

  // Orders by status
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "pending",
  ).length;
  const processingOrders = orders.filter(
    (o) => o.orderStatus === "processing",
  ).length;
  const shippedOrders = orders.filter(
    (o) => o.orderStatus === "shipped",
  ).length;
  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === "delivered",
  ).length;

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ShoppingCartIcon,
      color: "bg-blue-500",
      sub: `${pendingOrders} pending`,
    },
    {
      label: "Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: "bg-green-500",
      sub: `${deliveredOrders} delivered`,
    },
    {
      label: "Products",
      value: totalProducts,
      icon: ShoppingBagIcon,
      color: "bg-purple-500",
      sub: "in catalog",
    },
    {
      label: "Users",
      value: totalUsers,
      icon: UsersIcon,
      color: "bg-orange-500",
      sub: "registered",
    },
  ];

  const orderStatusStats = [
    { label: "Pending", count: pendingOrders, color: "bg-yellow-500" },
    { label: "Processing", count: processingOrders, color: "bg-purple-500" },
    { label: "Shipped", count: shippedOrders, color: "bg-orange-500" },
    { label: "Delivered", count: deliveredOrders, color: "bg-green-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-text">{stat.value}</p>
            <p className="text-sm text-text-light">{stat.label}</p>
            <p className="text-xs text-text-light mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-text mb-4">Order Status</h2>
          <div className="space-y-3">
            {orderStatusStats.map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-light">{stat.label}</span>
                  <span className="font-medium">{stat.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${stat.color} h-2 rounded-full`}
                    style={{
                      width: `${totalOrders > 0 ? (stat.count / totalOrders) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-text mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-text-light text-sm">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-text-light">
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ₹{order.total?.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        order.orderStatus === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.orderStatus === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
