// frontend/src/pages/admin/Colors.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PaintBrushIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Colors = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    hexCode: "#000000",
    slug: "",
    description: "",
    isActive: true,
  });

  // Fetch colors
  const { data: colorsData, isLoading } = useQuery({
    queryKey: ["admin-colors"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/colors`);
      return data.colors || [];
    },
  });

  // Create color
  const createMutation = useMutation({
    mutationFn: async (colorData) => {
      const { data } = await axios.post(`${API_URL}/colors`, colorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      toast.success("Color created successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create color");
    },
  });

  // Update color
  const updateMutation = useMutation({
    mutationFn: async ({ id, colorData }) => {
      const { data } = await axios.put(`${API_URL}/colors/${id}`, colorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      toast.success("Color updated successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update color");
    },
  });

  // Delete color
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/colors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      toast.success("Color deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete color");
    },
  });

  // Toggle color status
  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      const color = colorsData.find((c) => c._id === id);
      await axios.put(`${API_URL}/colors/${id}`, { isActive: !color.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colors"] });
      toast.success("Color status updated!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort colors
  const colors = (colorsData || [])
    .filter(
      (color) =>
        color.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        color.hexCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        color.slug?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUpIcon className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDownIcon className="w-3 h-3 inline ml-1" />
    );
  };

  const openModal = (color = null) => {
    if (color) {
      setEditingColor(color);
      setFormData({
        name: color.name || "",
        hexCode: color.hexCode || "#000000",
        slug: color.slug || "",
        description: color.description || "",
        isActive: color.isActive !== undefined ? color.isActive : true,
      });
    } else {
      setEditingColor(null);
      setFormData({
        name: "",
        hexCode: "#000000",
        slug: "",
        description: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingColor(null);
    setFormData({
      name: "",
      hexCode: "#000000",
      slug: "",
      description: "",
      isActive: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Color name is required");
      return;
    }

    const dataToSubmit = {
      ...formData,
      slug:
        formData.slug.trim() ||
        formData.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-"),
    };

    if (editingColor) {
      updateMutation.mutate({ id: editingColor._id, colorData: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete color "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Predefined color suggestions
  const colorSuggestions = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#C0C0C0",
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Colors</h1>
          <p className="text-sm text-text-light mt-1">
            {colors.length} colors found
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Add Color
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search colors by name, hex code, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Colors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
            >
              <div className="h-12 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : colors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <PaintBrushIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Colors Found
          </h3>
          <p className="text-text-light mb-6 text-sm">
            {searchQuery
              ? "Try adjusting your search"
              : "Start adding colors to your store"}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="btn-outline text-sm"
            >
              Clear Search
            </button>
          ) : (
            <button onClick={() => openModal()} className="btn-primary text-sm">
              Add Your First Color
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {colors.map((color) => (
            <div
              key={color._id}
              className={`bg-white rounded-xl border p-4 hover:shadow-lg transition ${
                color.isActive ? "border-gray-100" : "border-red-200 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg border flex-shrink-0"
                  style={{ backgroundColor: color.hexCode || "#000000" }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text">{color.name}</h3>
                  <p className="text-xs text-text-light mt-0.5">
                    ID: {color.colorId || color._id}
                  </p>
                  <p className="text-xs text-text-light font-mono">
                    Hex: {color.hexCode}
                  </p>
                  <p className="text-xs text-text-light">slug: {color.slug}</p>
                  {color.description && (
                    <p className="text-xs text-text-light mt-1 line-clamp-2">
                      {color.description}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      color.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {color.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                <button
                  onClick={() => toggleMutation.mutate(color._id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                  title={color.isActive ? "Deactivate" : "Activate"}
                >
                  {color.isActive ? (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <XMarkIcon className="w-4 h-4 text-red-500" />
                  )}
                </button>
                <button
                  onClick={() => openModal(color)}
                  className="p-1.5 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(color._id, color.name)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingColor ? "Edit Color" : "Add New Color"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Color Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Black, White, Navy Blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Hex Code *
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.hexCode}
                    onChange={(e) =>
                      setFormData({ ...formData, hexCode: e.target.value })
                    }
                    className="w-12 h-12 border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.hexCode}
                    onChange={(e) =>
                      setFormData({ ...formData, hexCode: e.target.value })
                    }
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary font-mono"
                    placeholder="#000000"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {colorSuggestions.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, hexCode: hex })}
                      className="w-6 h-6 rounded border hover:ring-2 hover:ring-primary transition"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Auto-generated if left empty"
                />
                <p className="text-xs text-text-light mt-1">
                  URL-friendly version of the name. Leave empty to
                  auto-generate.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Brief description of this color"
                  rows="3"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="btn-primary text-sm flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingColor
                      ? "Update Color"
                      : "Create Color"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Colors;
