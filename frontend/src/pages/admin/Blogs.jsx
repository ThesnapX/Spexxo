// frontend/src/pages/admin/Blogs.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const scoreColors = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
};

const scoreText = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  if (score >= 20) return "text-orange-600";
  return "text-red-600";
};

const Blogs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blogs", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 12 });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await axios.get(`${API_URL}/blogs/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/blogs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog deleted!");
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to delete"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      await axios.put(
        `${API_URL}/blogs/${id}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Status updated!");
    },
  });

  const blogs = data?.blogs || [];
  const pagination = data?.pagination || {};
  const filtered = blogs.filter(
    (b) =>
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">All Blogs</h1>
          <p className="text-sm text-text-light mt-1">
            {pagination.total || 0} blogs · {filtered.length} shown
          </p>
        </div>
        <Link
          to="/admin/blogs/add"
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-5 h-5" /> Add Blog
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search blogs by title or excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Blog Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Blogs Found
          </h3>
          <p className="text-text-light text-sm mb-6">
            {search || statusFilter
              ? "Try adjusting your filters"
              : "Create your first blog post"}
          </p>
          {!search && !statusFilter && (
            <Link to="/admin/blogs/add" className="btn-primary text-sm">
              <PlusIcon className="w-4 h-4 inline mr-1" /> Add Blog
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((blog) => (
            <div
              key={blog._id}
              onClick={() => navigate(`/admin/blogs/view/${blog._id}`)}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer group"
            >
              {/* Cover image */}
              <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                {blog.featuredImage?.url ? (
                  <img
                    src={blog.featuredImage.url}
                    alt={blog.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <DocumentTextIcon className="w-12 h-12" />
                  </div>
                )}

                {/* Status badge */}
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    blog.status === "published"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {blog.status}
                </span>

                {/* SEO Score badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-md">
                  <ChartBarIcon
                    className={`w-3.5 h-3.5 ${scoreText(blog.seoScore || 0)}`}
                  />
                  <span
                    className={`text-xs font-bold ${scoreText(blog.seoScore || 0)}`}
                  >
                    {blog.seoScore || 0}
                  </span>
                </div>
              </div>

              {/* SEO Score bar */}
              <div className="h-1 bg-gray-100">
                <div
                  className={`h-1 ${scoreColors(blog.seoScore || 0)} transition-all`}
                  style={{ width: `${blog.seoScore || 0}%` }}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {blog.category && (
                    <span className="text-xs bg-[#EBF4FC] text-[#3D96EB] px-2 py-0.5 rounded-full">
                      {blog.category.name}
                    </span>
                  )}
                  <span className="text-xs text-text-light">
                    {blog.views || 0} views
                  </span>
                  {blog.readTime && (
                    <span className="text-xs text-text-light">
                      · {blog.readTime} min
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-text text-sm mb-1 line-clamp-2 group-hover:text-primary transition">
                  {blog.title}
                </h3>

                <p className="text-xs text-text-light line-clamp-2 mb-3">
                  {blog.excerpt || "No excerpt"}
                </p>

                <p className="text-xs text-text-light mb-3">
                  by {blog.author} ·{" "}
                  {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                {/* Actions */}
                <div
                  className="flex justify-end gap-1 pt-3 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to={`/admin/blogs/view/${blog._id}`}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-[#EBF4FC] rounded-lg transition"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => toggleMutation.mutate(blog._id)}
                    className={`p-2 rounded-lg transition ${
                      blog.status === "published"
                        ? "text-yellow-500 hover:bg-yellow-50"
                        : "text-green-500 hover:bg-green-50"
                    }`}
                    title={
                      blog.status === "published" ? "Unpublish" : "Publish"
                    }
                  >
                    {blog.status === "published" ? (
                      <PauseCircleIcon className="w-4 h-4" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                  </button>
                  <Link
                    to={`/admin/blogs/edit/${blog._id}`}
                    className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this blog?"))
                        deleteMutation.mutate(blog._id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-text-light">
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page === pagination.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Blogs;
