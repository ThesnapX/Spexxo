import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Shapes = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShape, setEditingShape] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  // Fetch shapes
  const { data: shapesData, isLoading } = useQuery({
    queryKey: ["admin-shapes"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/shapes`);
      return data.shapes || [];
    },
  });

  // Create shape
  const createMutation = useMutation({
    mutationFn: async (shapeData) => {
      const { data } = await axios.post(`${API_URL}/shapes`, shapeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shapes"] });
      toast.success("Shape created successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create shape");
    },
  });

  // Update shape
  const updateMutation = useMutation({
    mutationFn: async ({ id, shapeData }) => {
      const { data } = await axios.put(`${API_URL}/shapes/${id}`, shapeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shapes"] });
      toast.success("Shape updated successfully!");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update shape");
    },
  });

  // Delete shape
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/shapes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shapes"] });
      toast.success("Shape deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete shape");
    },
  });

  // Toggle shape status
  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      const shape = shapesData.find((s) => s._id === id);
      await axios.put(`${API_URL}/shapes/${id}`, { isActive: !shape.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shapes"] });
      toast.success("Shape status updated!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const shapes = (shapesData || []).filter(
    (shape) =>
      shape.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shape.slug?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openModal = (shape = null) => {
    if (shape) {
      setEditingShape(shape);
      setFormData({
        name: shape.name || "",
        slug: shape.slug || "",
        description: shape.description || "",
        isActive: shape.isActive !== undefined ? shape.isActive : true,
      });
    } else {
      setEditingShape(null);
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
    setEditingShape(null);
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
      toast.error("Shape name is required");
      return;
    }

    // Auto-generate slug if not provided
    const dataToSubmit = {
      ...formData,
      slug:
        formData.slug.trim() ||
        formData.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-"),
    };

    if (editingShape) {
      updateMutation.mutate({ id: editingShape._id, shapeData: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete shape "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Frame Shapes</h1>
          <p className="text-sm text-text-light mt-1">
            {shapes.length} shapes found
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Add Shape
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search shapes by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Shapes Grid */}
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
      ) : shapes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Squares2X2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Shapes Found
          </h3>
          <p className="text-text-light mb-6 text-sm">
            {searchQuery
              ? "Try adjusting your search"
              : "Start adding frame shapes to your store"}
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
              Add Your First Shape
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shapes.map((shape) => (
            <div
              key={shape._id}
              className={`bg-white rounded-xl border p-4 hover:shadow-lg transition ${
                shape.isActive ? "border-gray-100" : "border-red-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-text">{shape.name}</h3>
                  <p className="text-xs text-text-light mt-1">
                    slug: {shape.slug}
                  </p>
                  {shape.description && (
                    <p className="text-xs text-text-light mt-1 line-clamp-2">
                      {shape.description}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      shape.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {shape.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                <button
                  onClick={() => toggleMutation.mutate(shape._id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                  title={shape.isActive ? "Deactivate" : "Activate"}
                >
                  {shape.isActive ? (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <XMarkIcon className="w-4 h-4 text-red-500" />
                  )}
                </button>
                <button
                  onClick={() => openModal(shape)}
                  className="p-1.5 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(shape._id, shape.name)}
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
                {editingShape ? "Edit Shape" : "Add New Shape"}
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
                  Shape Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Rectangle, Round, Cat Eye"
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
                  placeholder="Brief description of this shape"
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
                    : editingShape
                      ? "Update Shape"
                      : "Create Shape"}
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

export default Shapes;
