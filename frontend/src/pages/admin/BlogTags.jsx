// frontend/src/pages/admin/BlogTags.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  TagIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BlogTags = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTag, setEditTag] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const { data: tags, isLoading } = useQuery({
    queryKey: ["blog-tags-admin"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/blogs/tags?includeInactive=true`,
      );
      return data.tags || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_URL}/blogs/tags`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags-admin"] });
      toast.success("Tag created!");
      resetForm();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axios.put(`${API_URL}/blogs/tags/${id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags-admin"] });
      toast.success("Tag updated!");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/blogs/tags/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags-admin"] });
      toast.success("Tag deleted!");
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Failed to delete"),
  });

  const resetForm = () => {
    setForm({ name: "", description: "", isActive: true });
    setEditTag(null);
    setShowForm(false);
  };

  const handleEdit = (tag) => {
    setEditTag(tag);
    setForm({
      name: tag.name,
      description: tag.description || "",
      isActive: tag.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (editTag) updateMutation.mutate({ id: editTag._id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = (tags || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Blog Tags</h1>
          <p className="text-sm text-text-light mt-1">{filtered.length} tags</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Add Tag
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editTag ? "Edit Tag" : "Add Tag"}
            </h2>
            <button onClick={resetForm}>
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm">Active</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">
                {editTag ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-outline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
            <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-text-light">No tags yet</p>
          </div>
        ) : (
          filtered.map((tag) => (
            <div
              key={tag._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text">
                  #{tag.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    tag.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {tag.isActive ? "Active" : "Off"}
                </span>
              </div>
              <p className="text-xs text-text-light mb-2">
                {tag.blogCount || 0} blogs
              </p>
              <div className="flex justify-end gap-1 pt-2 border-t">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-1.5 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete tag "${tag.name}"?`))
                      deleteMutation.mutate(tag._id);
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogTags;
