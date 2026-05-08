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
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Categories = () => {
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    productType: "",
    gender: "",
    sortOrder: "0",
  });
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-manage"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories;
    },
  });

  const { data: productsCount } = useQuery({
    queryKey: ["products-count-by-category"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=1000`);
      const counts = {};
      data.products?.forEach((p) => {
        const catId = p.category?._id || p.category;
        if (catId) counts[catId] = (counts[catId] || 0) + 1;
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
    setForm({
      name: "",
      description: "",
      productType: "",
      gender: "",
      sortOrder: "0",
    });
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
    setForm({
      name: cat.name,
      description: cat.description || "",
      productType: cat.productType || "",
      gender: cat.gender || "",
      sortOrder: cat.sortOrder?.toString() || "0",
    });
    setImagePreview(cat.image?.url || null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageData = editCategory?.image || null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        const { data } = await axios.post(`${API_URL}/upload/single`, formData);
        imageData = { url: data.image.url, alt: form.name };
      } catch (error) {
        toast.error("Image upload failed");
        setUploading(false);
        return;
      }
    }

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      image: imageData,
    };
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Categories</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary flex  items-center gap-2 text-sm"
        >
          <PlusIcon className="w-5 h-5" />
          <p>Add Category</p>
        </button>
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
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Type *
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { value: "eyeglasses", label: "Eyeglasses" },
                  { value: "sunglasses", label: "Sunglasses" },
                  { value: "contactlens", label: "Contact Lens" },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`px-4 py-2 rounded-full text-sm cursor-pointer border-2 transition-all select-none ${
                      form.productType?.includes(type.value)
                        ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.productType?.includes(type.value) || false}
                      onChange={(e) => {
                        const currentTypes = form.productType
                          ? form.productType.split(",")
                          : [];
                        let newTypes;
                        if (e.target.checked) {
                          newTypes = [...currentTypes, type.value];
                        } else {
                          newTypes = currentTypes.filter(
                            (t) => t !== type.value,
                          );
                        }
                        setForm({ ...form, productType: newTypes.join(",") });
                      }}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-light mt-2">
                Select all applicable types for this category
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender *</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { value: "men", label: "Men", icon: "" },
                  { value: "women", label: "Women", icon: "" },
                  { value: "kids", label: "Kids", icon: "" },
                  { value: "unisex", label: "Unisex", icon: "" },
                ].map((gender) => (
                  <label
                    key={gender.value}
                    className={`px-4 py-2 rounded-full text-sm cursor-pointer border-2 transition-all select-none ${
                      form.gender?.includes(gender.value)
                        ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.gender?.includes(gender.value) || false}
                      onChange={(e) => {
                        const currentGenders = form.gender
                          ? form.gender.split(",")
                          : [];
                        let newGenders;
                        if (e.target.checked) {
                          newGenders = [...currentGenders, gender.value];
                        } else {
                          newGenders = currentGenders.filter(
                            (g) => g !== gender.value,
                          );
                        }
                        setForm({ ...form, gender: newGenders.join(",") });
                      }}
                    />
                    {/* <span className="mr-1">{gender.icon}</span> */}
                    {gender.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-light mt-2">
                Select all applicable genders for this category
              </p>
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Category Image
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
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
                      className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#3D96EB] hover:bg-[#EBF4FC] transition">
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                {imagePreview && (
                  <label className="cursor-pointer text-sm text-[#3D96EB] hover:underline">
                    Change Image
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

            <div className="md:col-span-2">
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
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary text-sm"
              >
                {editCategory ? "Update" : "Create"}
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center p-8">Loading...</div>
        ) : categories?.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-gray-100">
            <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-text mb-1">No Categories</h3>
            <p className="text-text-light text-sm">Add your first category</p>
          </div>
        ) : (
          categories?.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {cat.image?.url ? (
                    <img
                      src={cat.image.url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {cat.gender === "men"
                        ? "👨"
                        : cat.gender === "women"
                          ? "👩"
                          : cat.gender === "kids"
                            ? "👶"
                            : "🕶️"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text truncate">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-text-light capitalize">
                    {cat.productType?.split(",").join(" • ")} |{" "}
                    {cat.gender?.split(",").join(" • ")}
                  </p>
                  <p className="text-xs text-[#3D96EB] mt-1">
                    {productsCount?.[cat._id] || 0} products
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleEdit(cat)}
                  className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
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

export default Categories;
