// frontend/src/pages/admin/Dashboard.jsx

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PackageIcon,
  TrendingUpIcon,
  EyeIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  ArrowPathIcon,
  CalendarIcon,
  TagIcon,
  TrophyIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
} from "recharts";
import { Link } from "react-router-dom";
import {
  format,
  subDays,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ============================================
// CONSTANTS
// ============================================
const LOW_STOCK_THRESHOLD = 5;
const COLORS = [
  "#3D96EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatIndianCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  const num = Number(amount);
  if (num === 0) return "₹0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  const formatted = abs.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
  return `${sign}₹${formatted}`;
};

const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN");
};

const getDateRange = (range) => {
  const now = new Date();
  let startDate, endDate, label;

  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = now;
      label = "Today";
      break;
    case "7d":
      startDate = subDays(now, 7);
      endDate = now;
      label = "Last 7 Days";
      break;
    case "30d":
      startDate = subDays(now, 30);
      endDate = now;
      label = "Last 30 Days";
      break;
    case "90d":
      startDate = subDays(now, 90);
      endDate = now;
      label = "Last 3 Months";
      break;
    case "180d":
      startDate = subDays(now, 180);
      endDate = now;
      label = "Last 6 Months";
      break;
    case "365d":
      startDate = subDays(now, 365);
      endDate = now;
      label = "Last 12 Months";
      break;
    default:
      startDate = subDays(now, 30);
      endDate = now;
      label = "Last 30 Days";
  }

  return { startDate, endDate, label };
};

const getPreviousPeriod = (startDate, endDate) => {
  const duration = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { prevStart, prevEnd };
};

const calculatePercentageChange = (current, previous) => {
  if (previous === 0 || previous === undefined || previous === null)
    return null;
  if (current === undefined || current === null) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(change * 10) / 10;
};

const safeDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const isInDateRange = (dateStr, startDate, endDate) => {
  if (!dateStr) return false;
  const d = safeDate(dateStr);
  if (!d) return false;
  return isWithinInterval(d, { start: startDate, end: endDate });
};

// ============================================
// SKELETON LOADER COMPONENTS
// ============================================
const KPISkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="h-8 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="h-64 bg-gray-100 rounded-lg"></div>
  </div>
);

const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="p-6 border-b">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    </div>
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="p-4 border-b border-gray-100 flex items-center gap-4"
      >
        <div className="h-12 w-12 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

// ============================================
// DASHBOARD COMPONENT
// ============================================
const Dashboard = () => {
  const [dateRange, setDateRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartView, setChartView] = useState("revenue");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Get date range
  const { startDate, endDate, label } = useMemo(
    () => getDateRange(dateRange),
    [dateRange],
  );

  // Fetch all data
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["admin-orders-all"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/orders/admin/all?limit=500`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["admin-products-all"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/products?limit=500&includeInactive=true`,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = ordersLoading || productsLoading || usersLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchOrders(), refetchProducts(), refetchUsers()]);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  // ============================================
  // DATA PROCESSING
  // ============================================
  const orders = useMemo(() => ordersData?.orders || [], [ordersData]);
  const products = useMemo(() => productsData?.products || [], [productsData]);
  const users = useMemo(() => usersData?.users || [], [usersData]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order.createdAt) return false;
      return isInDateRange(order.createdAt, startDate, endDate);
    });
  }, [orders, startDate, endDate]);

  // Previous period orders for comparison
  const { prevStart, prevEnd } = useMemo(
    () => getPreviousPeriod(startDate, endDate),
    [startDate, endDate],
  );
  const previousOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order.createdAt) return false;
      return isInDateRange(order.createdAt, prevStart, prevEnd);
    });
  }, [orders, prevStart, prevEnd]);

  // ============================================
  // KPI CALCULATIONS
  // ============================================
  const kpis = useMemo(() => {
    // Current period
    const currentTotalRevenue = filteredOrders
      .filter(
        (o) => o.orderStatus !== "cancelled" && o.paymentStatus !== "refunded",
      )
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const currentTotalOrders = filteredOrders.length;
    const currentProductsSold = filteredOrders.reduce((sum, o) => {
      return (
        sum + (o.items || []).reduce((s, item) => s + (item.quantity || 0), 0)
      );
    }, 0);

    const currentPendingOrders = filteredOrders.filter(
      (o) => o.orderStatus === "pending",
    ).length;
    const currentDeliveredOrders = filteredOrders.filter(
      (o) => o.orderStatus === "delivered",
    ).length;
    const currentCancelledOrders = filteredOrders.filter(
      (o) => o.orderStatus === "cancelled",
    ).length;

    const currentAOV =
      currentTotalOrders > 0 ? currentTotalRevenue / currentTotalOrders : 0;

    // Previous period
    const previousTotalRevenue = previousOrders
      .filter(
        (o) => o.orderStatus !== "cancelled" && o.paymentStatus !== "refunded",
      )
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const previousTotalOrders = previousOrders.length;
    const previousProductsSold = previousOrders.reduce((sum, o) => {
      return (
        sum + (o.items || []).reduce((s, item) => s + (item.quantity || 0), 0)
      );
    }, 0);

    const previousAOV =
      previousTotalOrders > 0 ? previousTotalRevenue / previousTotalOrders : 0;

    // New vs Returning Customers
    const customerOrders = {};
    filteredOrders.forEach((order) => {
      const userId = order.user?._id || order.user;
      if (userId) {
        if (!customerOrders[userId]) customerOrders[userId] = [];
        customerOrders[userId].push(order);
      }
    });

    const customerOrderCounts = Object.values(customerOrders).map(
      (orders) => orders.length,
    );
    const newCustomers = customerOrderCounts.filter(
      (count) => count === 1,
    ).length;
    const returningCustomers = customerOrderCounts.filter(
      (count) => count > 1,
    ).length;
    const totalCustomers = newCustomers + returningCustomers;

    const repeatPurchaseRate =
      totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    const avgOrdersPerCustomer =
      totalCustomers > 0 ? filteredOrders.length / totalCustomers : 0;

    // Percentage changes
    const revenueChange = calculatePercentageChange(
      currentTotalRevenue,
      previousTotalRevenue,
    );
    const ordersChange = calculatePercentageChange(
      currentTotalOrders,
      previousTotalOrders,
    );
    const productsSoldChange = calculatePercentageChange(
      currentProductsSold,
      previousProductsSold,
    );
    const aovChange = calculatePercentageChange(currentAOV, previousAOV);

    return {
      totalRevenue: currentTotalRevenue,
      totalOrders: currentTotalOrders,
      productsSold: currentProductsSold,
      avgOrderValue: currentAOV,
      pendingOrders: currentPendingOrders,
      deliveredOrders: currentDeliveredOrders,
      cancelledOrders: currentCancelledOrders,
      newCustomers,
      returningCustomers,
      totalCustomers,
      repeatPurchaseRate,
      avgOrdersPerCustomer,
      revenueChange,
      ordersChange,
      productsSoldChange,
      aovChange,
    };
  }, [filteredOrders, previousOrders]);

  // ============================================
  // CHART DATA
  // ============================================
  const chartData = useMemo(() => {
    const days = {};

    filteredOrders.forEach((order) => {
      const date = safeDate(order.createdAt);
      if (!date) return;
      const key = format(date, "yyyy-MM-dd");

      if (!days[key]) {
        days[key] = { date: key, revenue: 0, orders: 0, products: 0 };
      }

      if (
        order.orderStatus !== "cancelled" &&
        order.paymentStatus !== "refunded"
      ) {
        days[key].revenue += order.total || 0;
      }

      days[key].orders += 1;

      if (order.items) {
        const productCount = order.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0,
        );
        days[key].products += productCount;
      }
    });

    const sorted = Object.keys(days)
      .sort()
      .map((key) => days[key]);

    if (sorted.length === 0) {
      return [
        {
          date: format(new Date(), "yyyy-MM-dd"),
          revenue: 0,
          orders: 0,
          products: 0,
        },
      ];
    }

    return sorted;
  }, [filteredOrders]);

  // ============================================
  // ORDER STATUS DATA
  // ============================================
  const orderStatusData = useMemo(() => {
    const statuses = {};
    const statusColors = {
      pending: "#F59E0B",
      confirmed: "#3D96EB",
      processing: "#8B5CF6",
      shipped: "#14B8A6",
      delivered: "#10B981",
      cancelled: "#EF4444",
      refunded: "#6B7280",
      refund_pending: "#F97316",
    };

    filteredOrders.forEach((order) => {
      const status = order.orderStatus || "pending";
      if (!statuses[status]) {
        statuses[status] = 0;
      }
      statuses[status]++;
    });

    const sorted = Object.entries(statuses)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);

    return sorted;
  }, [filteredOrders]);

  // ============================================
  // TOP PRODUCTS
  // ============================================
  const topProducts = useMemo(() => {
    const productSales = {};

    filteredOrders.forEach((order) => {
      if (!order.items) return;
      order.items.forEach((item) => {
        const productId = item.product?._id || item.product;
        if (!productId) return;
        if (!productSales[productId]) {
          const productData = products.find((p) => p._id === productId);
          productSales[productId] = {
            productId,
            name: item.name || productData?.name || "Unknown Product",
            image: item.image || productData?.images?.[0]?.url || null,
            quantity: 0,
            revenue: 0,
            sku: item.sku || productData?.sku || "",
            stock: productData?.stock || 0,
          };
        }
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue +=
          (item.price || 0) * (item.quantity || 0);
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders, products]);

  // ============================================
  // CATEGORY PERFORMANCE
  // ============================================
  const categoryPerformance = useMemo(() => {
    const categories = {};

    filteredOrders.forEach((order) => {
      if (!order.items) return;
      order.items.forEach((item) => {
        const productData = products.find(
          (p) => p._id === (item.product?._id || item.product),
        );
        if (!productData) return;

        let categoryName =
          productData.productCategory ||
          productData.productType ||
          "Uncategorized";

        if (!categories[categoryName]) {
          categories[categoryName] = {
            name: categoryName,
            revenue: 0,
            quantity: 0,
          };
        }
        categories[categoryName].revenue +=
          (item.price || 0) * (item.quantity || 0);
        categories[categoryName].quantity += item.quantity || 0;
      });
    });

    const totalRevenue = Object.values(categories).reduce(
      (sum, c) => sum + c.revenue,
      0,
    );

    return Object.values(categories)
      .map((c) => ({
        ...c,
        percentage: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders, products]);

  // ============================================
  // BRAND PERFORMANCE
  // ============================================
  const brandPerformance = useMemo(() => {
    const brands = {};

    filteredOrders.forEach((order) => {
      if (!order.items) return;
      order.items.forEach((item) => {
        const productData = products.find(
          (p) => p._id === (item.product?._id || item.product),
        );
        if (!productData) return;

        const brandName = productData.brand?.name || "Unknown Brand";

        if (!brands[brandName]) {
          brands[brandName] = { name: brandName, revenue: 0, quantity: 0 };
        }
        brands[brandName].revenue += (item.price || 0) * (item.quantity || 0);
        brands[brandName].quantity += item.quantity || 0;
      });
    });

    return Object.values(brands)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders, products]);

  // ============================================
  // PAYMENT METHOD BREAKDOWN
  // ============================================
  const paymentBreakdown = useMemo(() => {
    const methods = {};

    filteredOrders.forEach((order) => {
      const method = order.paymentMethod || "unknown";
      const key =
        method === "cod"
          ? "COD"
          : method === "online"
            ? "Online (Razorpay)"
            : method.toUpperCase();

      if (!methods[key]) {
        methods[key] = { name: key, orders: 0, revenue: 0 };
      }
      methods[key].orders += 1;
      if (
        order.orderStatus !== "cancelled" &&
        order.paymentStatus !== "refunded"
      ) {
        methods[key].revenue += order.total || 0;
      }
    });

    return Object.values(methods).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // ============================================
  // INVENTORY ALERTS
  // ============================================
  const inventoryAlerts = useMemo(() => {
    const outOfStock = products.filter(
      (p) => (p.stock || 0) <= 0 && p.isActive !== false,
    );
    const lowStock = products.filter(
      (p) =>
        (p.stock || 0) > 0 &&
        (p.stock || 0) <= LOW_STOCK_THRESHOLD &&
        p.isActive !== false,
    );
    const healthyStock = products.filter(
      (p) => (p.stock || 0) > LOW_STOCK_THRESHOLD && p.isActive !== false,
    );

    return {
      outOfStock,
      lowStock,
      healthyStock,
      total: products.length,
    };
  }, [products]);

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderChangeIndicator = (change) => {
    if (change === null || change === undefined) return null;
    const isPositive = change >= 0;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
      >
        {isPositive ? (
          <ArrowUpIcon className="w-3 h-3" />
        ) : (
          <ArrowDownIcon className="w-3 h-3" />
        )}
        {Math.abs(change)}%
      </span>
    );
  };

  const renderKPI = (
    label,
    value,
    change,
    icon,
    subtitle = "",
    formatter = formatNumber,
  ) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-text-light">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-text">
            {formatter(value)}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {change !== undefined &&
              change !== null &&
              renderChangeIndicator(change)}
            {subtitle && (
              <span className="text-xs text-text-light">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  if (isLoading && filteredOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <div className="h-4 w-32 bg-gray-200 rounded mt-1 animate-pulse"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <KPISkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-text-light mt-1">
            Analytics for {label} · {format(startDate, "MMM d, yyyy")} -{" "}
            {format(endDate, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="180d">Last 6 Months</option>
            <option value="365d">Last 12 Months</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          <span className="text-xs text-text-light hidden sm:block">
            Updated {format(lastUpdated, "h:mm a")}
          </span>
        </div>
      </div>

      {/* ==========================================
          KPI CARDS
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderKPI(
          "Revenue",
          kpis.totalRevenue,
          kpis.revenueChange,
          <CurrencyRupeeIcon className="w-5 h-5" />,
          `vs previous ${label}`,
          formatIndianCurrency,
        )}
        {renderKPI(
          "Total Orders",
          kpis.totalOrders,
          kpis.ordersChange,
          <ShoppingCartIcon className="w-5 h-5" />,
        )}
        {renderKPI(
          "Avg Order Value",
          kpis.avgOrderValue,
          kpis.aovChange,
          <TrendingUpIcon className="w-5 h-5" />,
          undefined,
          formatIndianCurrency,
        )}
        {renderKPI(
          "Products Sold",
          kpis.productsSold,
          kpis.productsSoldChange,
          <PackageIcon className="w-5 h-5" />,
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderKPI(
          "Pending Orders",
          kpis.pendingOrders,
          null,
          <ClockIcon className="w-5 h-5 text-yellow-500" />,
        )}
        {renderKPI(
          "Delivered Orders",
          kpis.deliveredOrders,
          null,
          <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        )}
        {renderKPI(
          "Cancelled Orders",
          kpis.cancelledOrders,
          null,
          <XCircleIcon className="w-5 h-5 text-red-500" />,
        )}
        {renderKPI(
          "Total Customers",
          kpis.totalCustomers,
          null,
          <UsersIcon className="w-5 h-5" />,
          `${kpis.returningCustomers} returning (${Math.round(kpis.repeatPurchaseRate)}% repeat)`,
        )}
      </div>

      {/* ==========================================
          MAIN CHART
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text">
              Revenue & Orders
            </h2>
            <p className="text-sm text-text-light">
              Daily breakdown for selected period
            </p>
          </div>
          <div className="flex gap-2">
            {["revenue", "orders", "products"].map((view) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  chartView === view
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-light hover:bg-gray-200"
                }`}
              >
                {view === "revenue" && "Revenue"}
                {view === "orders" && "Orders"}
                {view === "products" && "Products"}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 md:h-80 w-full">
          {chartData.length === 0 ||
          chartData.every(
            (d) => d.revenue === 0 && d.orders === 0 && d.products === 0,
          ) ? (
            <div className="h-full flex items-center justify-center text-text-light">
              No data available for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date) => format(parseISO(date), "MMM d")}
                  interval={Math.max(0, Math.floor(chartData.length / 20))}
                  height={30}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    if (chartView === "revenue")
                      return `₹${(value / 1000).toFixed(0)}K`;
                    return formatNumber(value);
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatNumber(value)}
                  hide={chartView === "revenue"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value, name) => {
                    if (name === "Revenue")
                      return [formatIndianCurrency(value), name];
                    return [formatNumber(value), name];
                  }}
                  labelFormatter={(label) =>
                    format(parseISO(label), "MMM d, yyyy")
                  }
                />
                <Legend />
                {chartView === "revenue" && (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="orders"
                      name="Orders"
                      fill="#3D96EB"
                      opacity={0.6}
                      barSize={20}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </>
                )}
                {chartView === "orders" && (
                  <Bar
                    yAxisId="left"
                    dataKey="orders"
                    name="Orders"
                    fill="#3D96EB"
                    barSize={30}
                  />
                )}
                {chartView === "products" && (
                  <Bar
                    yAxisId="left"
                    dataKey="products"
                    name="Products Sold"
                    fill="#8B5CF6"
                    barSize={30}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ==========================================
          TWO COLUMN: ORDER STATUS + PAYMENT BREAKDOWN
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Order Status</h2>
          {orderStatusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-light">
              No orders
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {orderStatusData.map((status) => (
              <div
                key={status.name}
                className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </span>
                <span className="font-medium">{status.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Payment Methods
          </h2>
          {paymentBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-light">
              No payment data
            </div>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map((method) => (
                <div
                  key={method.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4 text-text-light" />
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {formatIndianCurrency(method.revenue)}
                    </div>
                    <div className="text-xs text-text-light">
                      {formatNumber(method.orders)} orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          SALES BREAKDOWN
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-text mb-4">
          Sales Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-text-light">Gross Revenue</p>
            <p className="text-lg font-bold text-text">
              {formatIndianCurrency(kpis.totalRevenue)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-text-light">Discounts</p>
            <p className="text-lg font-bold text-red-500">
              {formatIndianCurrency(0)}
            </p>
            <p className="text-xs text-text-light">Not tracked yet</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-text-light">Refunds</p>
            <p className="text-lg font-bold text-red-500">
              {formatIndianCurrency(0)}
            </p>
            <p className="text-xs text-text-light">Not tracked yet</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-text-light">Shipping</p>
            <p className="text-lg font-bold text-text">
              {formatIndianCurrency(0)}
            </p>
            <p className="text-xs text-text-light">Included in total</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <p className="text-xs text-text-light">Net Revenue</p>
            <p className="text-lg font-bold text-green-600">
              {formatIndianCurrency(kpis.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          CATEGORY + BRAND PERFORMANCE
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Top Categories
          </h2>
          {categoryPerformance.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-light">
              No category data
            </div>
          ) : (
            <div className="space-y-3">
              {categoryPerformance.slice(0, 5).map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-text-light">
                      {formatNumber(cat.quantity)} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatIndianCurrency(cat.revenue)}
                    </p>
                    <p className="text-xs text-text-light">
                      {cat.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Top Brands</h2>
          {brandPerformance.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-light">
              No brand data
            </div>
          ) : (
            <div className="space-y-3">
              {brandPerformance.slice(0, 5).map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{brand.name}</p>
                    <p className="text-xs text-text-light">
                      {formatNumber(brand.quantity)} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatIndianCurrency(brand.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          CUSTOMER ANALYTICS
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-text mb-4">
          Customer Analytics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <UsersIcon className="w-4 h-4 text-primary" />
              <p className="text-xs text-text-light">Total Customers</p>
            </div>
            <p className="text-xl font-bold text-text">
              {formatNumber(kpis.totalCustomers)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <UserPlusIcon className="w-4 h-4 text-green-500" />
              <p className="text-xs text-text-light">New Customers</p>
            </div>
            <p className="text-xl font-bold text-text">
              {formatNumber(kpis.newCustomers)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <UserMinusIcon className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-text-light">Returning Customers</p>
            </div>
            <p className="text-xl font-bold text-text">
              {formatNumber(kpis.returningCustomers)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrophyIcon className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-text-light">Repeat Purchase Rate</p>
            </div>
            <p className="text-xl font-bold text-text">
              {kpis.repeatPurchaseRate.toFixed(1)}%
            </p>
            <p className="text-xs text-text-light">
              {kpis.avgOrdersPerCustomer.toFixed(1)} avg orders
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          INVENTORY ALERTS
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Inventory Alerts</h2>
          <Link
            to="/admin/products"
            className="text-sm text-primary hover:underline"
          >
            Manage Products →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              <p className="text-sm font-medium text-red-700">Out of Stock</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {inventoryAlerts.outOfStock.length}
            </p>
            <p className="text-xs text-red-600 mt-1">Products with 0 stock</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
              <p className="text-sm font-medium text-yellow-700">Low Stock</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {inventoryAlerts.lowStock.length}
            </p>
            <p className="text-xs text-yellow-600 mt-1">{`≤ ${LOW_STOCK_THRESHOLD} items left`}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <p className="text-sm font-medium text-green-700">
                Healthy Stock
              </p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {inventoryAlerts.healthyStock.length}
            </p>
            <p className="text-xs text-green-600 mt-1">{`> ${LOW_STOCK_THRESHOLD} items left`}</p>
          </div>
        </div>
      </div>

      {/* ==========================================
          TOP PRODUCTS + WISHLIST
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">
              Top Selling Products
            </h2>
            <Link
              to="/admin/products"
              className="text-sm text-primary hover:underline"
            >
              View All →
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-light">
              No product sales
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatNumber(product.quantity)} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatIndianCurrency(product.revenue)}
                    </p>
                    <p className="text-xs text-text-light">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wishlist Analytics */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">
              Most Added to Wishlist
            </h2>
            <div className="flex items-center gap-2 text-xs text-text-light">
              <HeartIcon className="w-3 h-3 text-red-400" />
              <span>Wishlist data available</span>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center text-text-light">
            <div className="text-center">
              <HeartIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Wishlist analytics coming soon</p>
              <p className="text-xs mt-1">Requires backend aggregation</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          RECENT ORDERS
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            View All →
          </Link>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-text-light">
            No orders in this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-text-light uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.slice(0, 10).map((order) => {
                  const statusColors = {
                    pending: "bg-yellow-100 text-yellow-700",
                    confirmed: "bg-blue-100 text-blue-700",
                    processing: "bg-purple-100 text-purple-700",
                    shipped: "bg-teal-100 text-teal-700",
                    delivered: "bg-green-100 text-green-700",
                    cancelled: "bg-red-100 text-red-700",
                    refunded: "bg-gray-100 text-gray-700",
                    refund_pending: "bg-orange-100 text-orange-700",
                  };

                  const paymentColors = {
                    pending: "bg-yellow-100 text-yellow-700",
                    paid: "bg-green-100 text-green-700",
                    failed: "bg-red-100 text-red-700",
                    refund_pending: "bg-orange-100 text-orange-700",
                    refunded: "bg-gray-100 text-gray-700",
                  };

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="p-4">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="font-medium text-sm text-primary hover:underline"
                        >
                          #{order.orderNumber || order._id.slice(-6)}
                        </Link>
                      </td>
                      <td className="p-4 text-sm">
                        {order.user?.firstName} {order.user?.lastName}
                      </td>
                      <td className="p-4 text-sm text-text-light">
                        {format(parseISO(order.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-4 text-sm font-semibold">
                        {formatIndianCurrency(order.total)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.orderStatus] || "bg-gray-100 text-gray-700"}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${paymentColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}
                        >
                          {order.paymentStatus === "refund_pending"
                            ? "Refund Pending"
                            : order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          RECENT USERS + RECENT PRODUCTS
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-sm text-primary hover:underline"
            >
              View All →
            </Link>
          </div>
          {users.length === 0 ? (
            <div className="p-8 text-center text-text-light">No users</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-text-light">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${user.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {user.isActive !== false ? "Active" : "Inactive"}
                    </span>
                    <p className="text-xs text-text-light mt-1">
                      {format(parseISO(user.createdAt), "MMM d")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Recent Products</h2>
            <Link
              to="/admin/products"
              className="text-sm text-primary hover:underline"
            >
              View All →
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="p-8 text-center text-text-light">No products</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatIndianCurrency(product.price)} •{" "}
                      {product.stock || 0} in stock
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${product.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {product.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
