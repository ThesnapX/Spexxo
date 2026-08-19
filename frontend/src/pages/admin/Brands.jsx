// frontend/src/pages/admin/Brands.jsx

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
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Brands = () => {
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [form, setForm] = useState({ name: "", description: "" });
  const queryClient = useQueryClient();

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands-manage"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands;
    },
  });

  const { data: productsCount } = useQuery({
    queryKey: ["products-count-by-brand"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=1000`);
      const counts = {};
      data.products?.forEach((p) => {
        const brandId = p.brand?._id || p.brand;
        if (brandId) counts[brandId] = (counts[brandId] || 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_URL}/brands`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-manage"] });
      toast.success("Brand created!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create brand");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axios.put(`${API_URL}/brands/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-manage"] });
      toast.success("Brand updated!");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-manage"] });
      toast.success("Brand deleted!");
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setImageFile(null);
    setImagePreview(null);
    setEditBrand(null);
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

  const handleEdit = (brand) => {
    setEditBrand(brand);
    setForm({ name: brand.name, description: brand.description || "" });
    setImagePreview(brand.logo?.url || null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let logoData = editBrand?.logo || null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        const { data } = await axios.post(`${API_URL}/upload/single`, formData);
        logoData = { url: data.image.url, alt: form.name };
      } catch (error) {
        toast.error("Image upload failed");
        setUploading(false);
        return;
      }
    }

    const payload = { ...form, logo: logoData };
    if (editBrand) {
      updateMutation.mutate({ id: editBrand._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setUploading(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this brand?")) deleteMutation.mutate(id);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort brands
  const filteredBrands = (brands || [])
    .filter((brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()),
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Brands</h1>
          <p className="text-sm text-text-light mt-1">
            {filteredBrands.length} brands found
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Brand
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands by name..."
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
              {editBrand ? "Edit Brand" : "Add Brand"}
            </h2>
            <button onClick={resetForm}>
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Brand Logo
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <img
                      src={imagePreview}
                      alt="Logo Preview"
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#3D96EB] hover:bg-[#EBF4FC] transition">
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary text-sm"
              >
                {editBrand ? "Update" : "Create"}
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

      {/* Brands Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center p-8">Loading...</div>
        ) : filteredBrands.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-gray-100">
            <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-text mb-1">No Brands Found</h3>
            <p className="text-text-light text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first brand"}
            </p>
          </div>
        ) : (
          filteredBrands.map((brand) => (
            <div
              key={brand._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {brand.logo?.url ? (
                    <img
                      src={brand.logo.url}
                      alt={brand.name}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {brand.name?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-text-light truncate">
                    ID: {brand.brandId || brand._id}
                  </p>
                  {brand.description && (
                    <p className="text-xs text-text-light truncate">
                      {brand.description}
                    </p>
                  )}
                  <p className="text-xs text-[#3D96EB] mt-1">
                    {productsCount?.[brand._id] || 0} products
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleEdit(brand)}
                  className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(brand._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Brands;
