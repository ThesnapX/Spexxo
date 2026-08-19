// frontend/src/pages/admin/Categories.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Categories = () => {
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ name: "" });
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-manage"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories || [];
    },
  });

  const { data: productsCount } = useQuery({
    queryKey: ["products-count-by-category"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=1000`);
      const counts = {};
      data.products?.forEach((p) => {
        if (p.categories && Array.isArray(p.categories)) {
          p.categories.forEach((cat) => {
            if (cat && cat._id) {
              counts[cat._id] = (counts[cat._id] || 0) + 1;
            }
          });
        } else if (p.category) {
          if (typeof p.category === "string") {
            p.category
              .split(",")
              .filter(Boolean)
              .forEach((catId) => {
                counts[catId] = (counts[catId] || 0) + 1;
              });
          } else if (typeof p.category === "object" && p.category._id) {
            counts[p.category._id] = (counts[p.category._id] || 0) + 1;
          }
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_URL}/categories`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-manage"] });
      toast.success("Category created!");
      resetForm();
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to create category";
      if (message.includes("duplicate") || message.includes("already exists")) {
        toast.error("Category with this name already exists!");
      } else {
        toast.error(message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axios.put(`${API_URL}/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-manage"] });
      toast.success("Category updated!");
      resetForm();
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to update category";
      if (message.includes("duplicate") || message.includes("already exists")) {
        toast.error("Category with this name already exists!");
      } else {
        toast.error(message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-manage"] });
      toast.success("Category deleted!");
    },
  });

  const resetForm = () => {
    setForm({ name: "" });
    setImageFile(null);
    setImagePreview(null);
    setEditCategory(null);
    setShowForm(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name });
    setImagePreview(cat.image?.url || null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let imageData = editCategory?.image || null;
    if (imageFile) {
      const fd = new FormData();
      fd.append("image", imageFile);
      try {
        const { data } = await axios.post(`${API_URL}/upload/single`, fd);
        imageData = { url: data.image.url, alt: form.name };
      } catch {
        toast.error("Image upload failed");
        setUploading(false);
        return;
      }
    }
    const payload = { name: form.name, image: imageData };
    if (editCategory) {
      updateMutation.mutate({ id: editCategory._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setUploading(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this category?")) deleteMutation.mutate(id);
  };

  // Filter categories
  const filteredCategories = (categories || []).filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Categories</h1>
          <p className="text-sm text-text-light mt-1">
            {filteredCategories.length} categories found
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {editCategory ? "Edit Category" : "Add Category"}
            </h2>
            <button onClick={resetForm}>
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="e.g. Men Eyeglasses"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Image
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#3D96EB] hover:bg-[#EBF4FC] transition">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-text-light mt-2">
                Recommended size: 400×400 px (Square)
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary text-sm"
              >
                {uploading
                  ? "Uploading..."
                  : editCategory
                    ? "Update Category"
                    : "Create Category"}
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

      {/* Categories Grid - Smaller Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {isLoading ? (
          <div className="col-span-full text-center p-8">Loading...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-gray-100">
            <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-text mb-1">
              No Categories Found
            </h3>
            <p className="text-text-light text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first category"}
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition group"
            >
              <div className="aspect-square bg-gray-50 overflow-hidden">
                {cat.image?.url ? (
                  <img
                    src={cat.image.url}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
                    {cat.name?.includes("Men")
                      ? "👨"
                      : cat.name?.includes("Women")
                        ? "👩"
                        : cat.name?.includes("Kid")
                          ? "👶"
                          : "🕶️"}
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="font-semibold text-text text-sm truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-text-light truncate">
                  ID: {cat.categoryId || cat._id}
                </p>
                <p className="text-xs text-[#3D96EB] mt-0.5">
                  {productsCount?.[cat._id] || 0} products
                </p>
              </div>
              <div className="flex justify-end gap-0.5 p-1.5 border-t">
                <button
                  onClick={() => handleEdit(cat)}
                  className="p-1.5 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
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

export default Categories;
