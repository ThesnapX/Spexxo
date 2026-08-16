import { useState } from "react";
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
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Users = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch users
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

  // Delete user mutation
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

  // Toggle user status (activate/deactivate)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      if (action === "deactivate") {
        await axios.put(`${API_URL}/users/${id}/deactivate`);
      } else {
        await axios.put(`${API_URL}/users/${id}/reactivate`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User status updated!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    },
  });

  // Filter users by search
  const users = (usersData || []).filter((user) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.customerId?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id, currentStatus) => {
    const action = currentStatus ? "deactivate" : "reactivate";
    const message = currentStatus
      ? "Deactivate this user? They will not be able to login."
      : "Reactivate this user? They will be able to login again.";
    if (window.confirm(message)) {
      toggleStatusMutation.mutate({ id, action });
    }
  };

  const handleViewUser = (id) => {
    navigate(`/admin/users/${id}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchQuery || roleFilter || statusFilter;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">All Users</h1>
          <p className="text-sm text-text-light mt-1">
            {users.length} users found
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-1"
          >
            <FunnelIcon className="w-4 h-4" />{" "}
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

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
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:underline mt-3"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Users Table */}
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
                    onClick={() => handleViewUser(user._id)}
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
                          onClick={() => handleViewUser(user._id)}
                          className="p-2 text-gray-500 hover:text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(
                              user._id,
                              user.isActive !== false,
                            )
                          }
                          className={`p-2 rounded-lg transition ${
                            user.isActive !== false
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-green-500 hover:bg-green-50"
                          }`}
                          title={
                            user.isActive !== false ? "Deactivate" : "Activate"
                          }
                        >
                          {user.isActive !== false ? (
                            <ShieldExclamationIcon className="w-4 h-4" />
                          ) : (
                            <ShieldCheckIcon className="w-4 h-4" />
                          )}
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
    </div>
  );
};

export default Users;
