// frontend/src/pages/admin/Subscribers.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  BellIcon,
  UserIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Subscribers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscribers", search, status, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ sort });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const { data } = await axios.get(`${API_URL}/subscribers?${params}`);
      return data;
    },
    staleTime: 30 * 1000,
  });

  const subscribers = data?.subscribers || [];
  const stats = data?.stats || {
    total: 0,
    activeCount: 0,
    guestCount: 0,
    registeredCount: 0,
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/subscribers/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Subscriber deleted!");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const response = await axios.get(
        `${API_URL}/subscribers/export?${params}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `subscribers-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded!");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleDelete = (id, email) => {
    if (window.confirm(`Delete subscriber "${email}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setSort("newest");
  };

  const hasFilters = search || status || sort !== "newest";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Subscribers</h1>
        <p className="text-sm text-text-light mt-1">
          All emails subscribed to your store notifications
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Total</p>
          <p className="text-2xl font-bold text-text">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.activeCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Registered Users</p>
          <p className="text-2xl font-bold text-primary">
            {stats.registeredCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Guests</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.guestCount}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="email-asc">Email: A → Z</option>
            <option value="email-desc">Email: Z → A</option>
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 hover:underline mt-3"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-text-light">Loading...</div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Subscribers Yet
          </h3>
          <p className="text-text-light text-sm">
            {hasFilters
              ? "Try adjusting your filters"
              : "Subscriptions from the footer will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Type
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Subscribed
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-text-light" />
                        <span className="font-medium text-sm text-text">
                          {s.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.user ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          <UserIcon className="w-3 h-3" />
                          {s.user.firstName} {s.user.lastName}
                          {s.user.customerId && ` (${s.user.customerId})`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                          Guest
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-light">
                      {new Date(
                        s.subscribedAt || s.createdAt,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          <CheckCircleIcon className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          <XCircleIcon className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s._id, s.email)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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

export default Subscribers;
