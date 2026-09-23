// frontend/src/pages/admin/UserInspection.jsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  UsersIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─────────────────────────────────────────────
// CSV helpers
// ─────────────────────────────────────────────
const escapeCsv = (val) => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const downloadCSV = (rows, filename) => {
  if (!rows || rows.length === 0) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += headers.map((h) => escapeCsv(row[h])).join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast.success("CSV downloaded!");
};

// ═══════════════════════════════════════════════
// SUB-TAB: All Users
// ═══════════════════════════════════════════════
const AllUsersTab = ({ onViewUser }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter === "active") params.set("isActive", "true");
      if (statusFilter === "inactive") params.set("isActive", "false");
      const { data } = await axios.get(`${API_URL}/users?${params}`);
      return data.users || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted!");
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Failed to delete"),
  });

  const users = (usersData || []).filter((u) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.customerId?.toLowerCase().includes(s) ||
      u.username?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s)
    );
  });

  const handleExport = () => {
    const rows = users.map((u) => ({
      "Customer ID": u.customerId || "",
      "First Name": u.firstName || "",
      "Last Name": u.lastName || "",
      Username: u.username || "",
      Email: u.email || "",
      Phone: u.phone || "",
      Role: u.role || "customer",
      Status: u.isActive !== false ? "Active" : "Inactive",
      "Joined At": u.createdAt ? new Date(u.createdAt).toISOString() : "",
    }));
    downloadCSV(rows, `users-${Date.now()}.csv`);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete user "${name}"?`)) deleteMutation.mutate(id);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchQuery || roleFilter || statusFilter;

  return (
    <>
      {/* Search + Export */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, customer ID, username, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleExport}
            className="btn-outline text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <FunnelIcon className="w-4 h-4" />{" "}
            {showFilters ? "Hide" : "Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-light mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
        {hasActiveFilters && showFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 hover:underline mt-3"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-text-light">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Users Found
          </h3>
          <p className="text-text-light text-sm">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "No users have registered yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Joined
                  </th>
                  <th className="text-right text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => onViewUser(user._id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-text">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-text-light">
                            ID: {user.customerId || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text flex items-center gap-1">
                        <EnvelopeIcon className="w-3.5 h-3.5 text-text-light" />
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-text-light flex items-center gap-1">
                          <PhoneIcon className="w-3.5 h-3.5" />
                          {user.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role || "Customer"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          user.isActive !== false
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.isActive !== false ? (
                          <CheckCircleIcon className="w-3 h-3" />
                        ) : (
                          <XCircleIcon className="w-3 h-3" />
                        )}
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text-light flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onViewUser(user._id)}
                          className="p-2 text-gray-500 hover:text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              user._id,
                              `${user.firstName} ${user.lastName}`,
                            )
                          }
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════
// SUB-TAB: Cart / Wishlist inspector
// ═══════════════════════════════════════════════
const CartWishlistTab = ({ type, onViewUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("days-desc");
  const [minItems, setMinItems] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-cart-wishlist", type, sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ type, sort: sortBy });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const { data } = await axios.get(
        `${API_URL}/users/cart-wishlist?${params}`,
      );
      return data.users || [];
    },
    staleTime: 30 * 1000,
  });

  const rows = data || [];

  const filteredRows = useMemo(() => {
    let out = rows;
    if (searchQuery.trim()) {
      const s = searchQuery.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.firstName?.toLowerCase().includes(s) ||
          r.lastName?.toLowerCase().includes(s) ||
          r.email?.toLowerCase().includes(s) ||
          r.username?.toLowerCase().includes(s) ||
          r.customerId?.toLowerCase().includes(s) ||
          r.phone?.toLowerCase().includes(s),
      );
    }
    if (minItems && Number(minItems) > 0) {
      out = out.filter((r) => r.count >= Number(minItems));
    }
    return out;
  }, [rows, searchQuery, minItems]);

  const totalItems = filteredRows.reduce((sum, r) => sum + (r.count || 0), 0);
  const EmptyIcon = type === "cart" ? ShoppingBagIcon : HeartIcon;
  const emptyLabel = type === "cart" ? "Cart" : "Wishlist";

  const handleExport = () => {
    const exportRows = filteredRows.map((r) => ({
      "Customer ID": r.customerId || "",
      "First Name": r.firstName || "",
      "Last Name": r.lastName || "",
      Username: r.username || "",
      Email: r.email || "",
      Phone: r.phone || "",
      "Total Items": r.count || 0,
      "Last Added At": r.lastAddedAt
        ? new Date(r.lastAddedAt).toISOString()
        : "",
      "Days Passed": r.daysPassed == null ? "" : r.daysPassed,
    }));
    downloadCSV(exportRows, `${type}-inspection-${Date.now()}.csv`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinItems("");
  };

  return (
    <>
      {/* Search + Sort + Export */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, customer ID, username, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="days-desc">Days Passed: Newest First</option>
            <option value="days-asc">Days Passed: Oldest First</option>
            <option value="count-desc">{emptyLabel} Items: High → Low</option>
            <option value="count-asc">{emptyLabel} Items: Low → High</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <FunnelIcon className="w-4 h-4" />{" "}
            {showFilters ? "Hide" : "Filters"}
          </button>
          <button
            onClick={handleExport}
            className="btn-outline text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-light mb-1">
                Minimum Items
              </label>
              <input
                type="number"
                min="0"
                value={minItems}
                onChange={(e) => setMinItems(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
          <p className="text-xs text-text-light">
            {filteredRows.length} users · {totalItems} total{" "}
            {emptyLabel.toLowerCase()} items
          </p>
          {(searchQuery || minItems) && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-text-light">Loading...</div>
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <EmptyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No {emptyLabel} Activity
          </h3>
          <p className="text-text-light text-sm">
            {searchQuery || minItems
              ? "Try adjusting your search/filters"
              : `No users have added items to their ${emptyLabel.toLowerCase()} yet`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Customer ID
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Total Items
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Last Added
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Days Passed
                  </th>
                  <th className="text-right text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => {
                  const isRecent = row.daysPassed === 0;
                  return (
                    <tr
                      key={row._id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => onViewUser(row._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                            {row.firstName?.[0]}
                            {row.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-text">
                              {row.firstName} {row.lastName}
                            </p>
                            <p className="text-xs text-text-light">
                              {row.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light">
                        {row.customerId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.count > 0
                              ? "bg-primary/10 text-primary"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {type === "cart" ? (
                            <ShoppingBagIcon className="w-3.5 h-3.5" />
                          ) : (
                            <HeartIcon className="w-3.5 h-3.5" />
                          )}
                          {row.count} item{row.count !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light">
                        {row.lastAddedAt ? (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            {new Date(row.lastAddedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.daysPassed == null ? (
                          <span className="text-xs text-text-light">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isRecent
                                ? "bg-green-100 text-green-700"
                                : row.daysPassed <= 7
                                  ? "bg-blue-100 text-blue-700"
                                  : row.daysPassed <= 30
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isRecent
                              ? "Today"
                              : `${row.daysPassed} day${
                                  row.daysPassed !== 1 ? "s" : ""
                                } ago`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewUser(row._id);
                          }}
                          className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════
// MAIN: User Inspection page
// ═══════════════════════════════════════════════
const UserInspection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const handleViewUser = (id) => navigate(`/admin/users/${id}`);

  const tabs = [
    { id: "all", label: "All Users", icon: UsersIcon },
    { id: "cart", label: "User Carts", icon: ShoppingBagIcon },
    { id: "wishlist", label: "User Wishlist", icon: HeartIcon },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">User Inspection</h1>
        <p className="text-sm text-text-light mt-1">
          Inspect users, their carts and wishlists. Export data anytime.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
                active
                  ? "bg-white text-primary border-t border-l border-r border-gray-200"
                  : "text-text-light hover:text-text hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "all" && <AllUsersTab onViewUser={handleViewUser} />}
      {activeTab === "cart" && (
        <CartWishlistTab type="cart" onViewUser={handleViewUser} />
      )}
      {activeTab === "wishlist" && (
        <CartWishlistTab type="wishlist" onViewUser={handleViewUser} />
      )}
    </div>
  );
};

export default UserInspection;
