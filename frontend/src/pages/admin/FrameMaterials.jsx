// frontend/src/pages/admin/FrameMaterials.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FrameMaterials = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrameMaterial, setEditingFrameMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  // Fetch frame materials
  const { data: frameMaterialsData, isLoading } = useQuery({
    queryKey: ["admin-frame-materials"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/frame-materials`);
      return data.frameMaterials || [];
    },
  });

  // Create frame material
  const createMutation = useMutation({
    mutationFn: async (frameMaterialData) => {
      const { data } = await axios.post(
        `${API_URL}/frame-materials`,
        frameMaterialData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-frame-materials"] });
      toast.success("Frame material created successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create frame material",
      );
    },
  });

  // Update frame material
  const updateMutation = useMutation({
    mutationFn: async ({ id, frameMaterialData }) => {
      const { data } = await axios.put(
        `${API_URL}/frame-materials/${id}`,
        frameMaterialData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-frame-materials"] });
      toast.success("Frame material updated successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update frame material",
      );
    },
  });

  // Delete frame material
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/frame-materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-frame-materials"] });
      toast.success("Frame material deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete frame material",
      );
    },
  });

  // Toggle frame material status
  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      const frameMaterial = frameMaterialsData.find((f) => f._id === id);
      await axios.put(`${API_URL}/frame-materials/${id}`, {
        isActive: !frameMaterial.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-frame-materials"] });
      toast.success("Frame material status updated!");
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

  // Filter and sort frame materials
  const frameMaterials = (frameMaterialsData || [])
    .filter(
      (frameMaterial) =>
        frameMaterial.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        frameMaterial.slug?.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const openModal = (frameMaterial = null) => {
    if (frameMaterial) {
      setEditingFrameMaterial(frameMaterial);
      setFormData({
        name: frameMaterial.name || "",
        slug: frameMaterial.slug || "",
        description: frameMaterial.description || "",
        isActive:
          frameMaterial.isActive !== undefined ? frameMaterial.isActive : true,
      });
    } else {
      setEditingFrameMaterial(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFrameMaterial(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Frame material name is required");
      return;
    }

    const dataToSubmit = {
      ...formData,
      slug:
        formData.slug.trim() ||
        formData.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-"),
    };

    if (editingFrameMaterial) {
      updateMutation.mutate({
        id: editingFrameMaterial._id,
        frameMaterialData: dataToSubmit,
      });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete frame material "${name}"?`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Frame Materials</h1>
          <p className="text-sm text-text-light mt-1">
            {frameMaterials.length} frame materials found
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Add Frame Material
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search frame materials by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Frame Materials Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : frameMaterials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Frame Materials Found
          </h3>
          <p className="text-text-light mb-6 text-sm">
            {searchQuery
              ? "Try adjusting your search"
              : "Start adding frame materials to your store"}
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
              Add Your First Frame Material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {frameMaterials.map((frameMaterial) => (
            <div
              key={frameMaterial._id}
              className={`bg-white rounded-xl border p-4 hover:shadow-lg transition ${
                frameMaterial.isActive
                  ? "border-gray-100"
                  : "border-red-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-text">
                    {frameMaterial.name}
                  </h3>
                  <p className="text-xs text-text-light mt-0.5">
                    ID: {frameMaterial.frameMaterialId || frameMaterial._id}
                  </p>
                  <p className="text-xs text-text-light">
                    slug: {frameMaterial.slug}
                  </p>
                  {frameMaterial.description && (
                    <p className="text-xs text-text-light mt-1 line-clamp-2">
                      {frameMaterial.description}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      frameMaterial.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {frameMaterial.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                <button
                  onClick={() => toggleMutation.mutate(frameMaterial._id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                  title={frameMaterial.isActive ? "Deactivate" : "Activate"}
                >
                  {frameMaterial.isActive ? (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <XMarkIcon className="w-4 h-4 text-red-500" />
                  )}
                </button>
                <button
                  onClick={() => openModal(frameMaterial)}
                  className="p-1.5 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    handleDelete(frameMaterial._id, frameMaterial.name)
                  }
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
                {editingFrameMaterial
                  ? "Edit Frame Material"
                  : "Add New Frame Material"}
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
                  Frame Material Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Metal, Acetate, Titanium"
                  required
                />
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
                  placeholder="Brief description of this frame material"
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
                    : editingFrameMaterial
                      ? "Update Frame Material"
                      : "Create Frame Material"}
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

export default FrameMaterials;
