// frontend/src/pages/admin/Users.jsx

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ═══════════════════════════════════════════════
// SUB-TAB: All Users (original behaviour preserved)
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

      const { data } = await axios.get(`${API_URL}/users?${params.toString()}`);
      return data.users || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });

  const users = (usersData || []).filter((user) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(s) ||
      user.lastName?.toLowerCase().includes(s) ||
      user.email?.toLowerCase().includes(s) ||
      user.customerId?.toLowerCase().includes(s) ||
      user.username?.toLowerCase().includes(s) ||
      user.phone?.toLowerCase().includes(s)
    );
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchQuery || roleFilter || statusFilter;

  return (
    <>
      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, customer ID, username, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-outline text-sm flex items-center gap-1"
        >
          <FunnelIcon className="w-4 h-4" />{" "}
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border-b border-gray-100"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Users Found
          </h3>
          <p className="text-text-light mb-6 text-sm">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "No users have registered yet"}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-outline text-sm">
              Clear Filters
            </button>
          )}
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
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
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
                          {user.username && (
                            <p className="text-xs text-text-light">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-text flex items-center gap-1">
                          <EnvelopeIcon className="w-3.5 h-3.5 text-text-light" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-text-light flex items-center gap-1">
                            <PhoneIcon className="w-3.5 h-3.5 text-text-light" />
                            {user.phone}
                          </p>
                        )}
                      </div>
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
                          title="View Details"
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
                          title="Delete"
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
// SUB-TAB: Cart / Wishlist inspector (shared component)
// ═══════════════════════════════════════════════
const CartWishlistTab = ({ type, onViewUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("days-desc");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-cart-wishlist", type, sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ type, sort: sortBy });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const { data } = await axios.get(
        `${API_URL}/users/cart-wishlist?${params.toString()}`,
      );
      return data.users || [];
    },
    staleTime: 30 * 1000,
  });

  const rows = data || [];

  // Local filter so typing feels instant (server also filters)
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const s = searchQuery.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.firstName?.toLowerCase().includes(s) ||
        r.lastName?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.username?.toLowerCase().includes(s) ||
        r.customerId?.toLowerCase().includes(s) ||
        r.phone?.toLowerCase().includes(s),
    );
  }, [rows, searchQuery]);

  const totalItems = filteredRows.reduce((sum, r) => sum + (r.count || 0), 0);

  const EmptyIcon = type === "cart" ? ShoppingBagIcon : HeartIcon;
  const emptyLabel = type === "cart" ? "Cart" : "Wishlist";

  return (
    <>
      {/* Search + Sort row */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search by name, email, customer ID, username, phone...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-light whitespace-nowrap">
              Sort by:
            </label>
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
          </div>
        </div>
        <p className="text-xs text-text-light mt-2">
          {filteredRows.length} users · {totalItems} total{" "}
          {emptyLabel.toLowerCase()} items
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border-b border-gray-100"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <EmptyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No {emptyLabel} Activity
          </h3>
          <p className="text-text-light text-sm">
            {searchQuery
              ? "Try adjusting your search"
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
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
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
                            {row.username && (
                              <p className="text-xs text-text-light">
                                @{row.username}
                              </p>
                            )}
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
                          title="View Details"
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
// MAIN Users PAGE — sub-tab host
// ═══════════════════════════════════════════════
const Users = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // "all" | "cart" | "wishlist"

  const handleViewUser = (id) => navigate(`/admin/users/${id}`);

  const tabs = [
    { id: "all", label: "All Users", icon: UsersIcon },
    { id: "cart", label: "User Carts", icon: ShoppingBagIcon },
    { id: "wishlist", label: "User Wishlist", icon: HeartIcon },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-sm text-text-light mt-1">
            Manage users, inspect their carts & wishlists
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
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

      {/* Sub-tab content */}
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

export default Users;
