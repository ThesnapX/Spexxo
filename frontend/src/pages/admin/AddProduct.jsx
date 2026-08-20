// frontend/src/pages/admin/AddProduct.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import VariantManager from "../../components/admin/VariantManager";
import SearchableMultiSelect from "../../components/admin/SearchableMultiSelect";
import SearchableSingleSelect from "../../components/admin/SearchableSingleSelect";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AddProduct = () => {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [variants, setVariants] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    category: "",
    brand: "",
    gender: "",
    productType: "eyeglasses",
    frameShape: "",
    frameMaterial: "",
    frameColor: "",
    frameWidth: "",
    lensWidth: "",
    frameHeight: "",
    bridge: "",
    temple: "",
    lensType: "",
    stock: "10",
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    isBestSeller: false,
    sku: "",
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories || [];
    },
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands || [];
    },
  });

  // Fetch shapes from API
  const { data: shapesData } = useQuery({
    queryKey: ["shapes"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/shapes`);
      return data.shapes || [];
    },
  });

  // Fetch colors from API
  const { data: colorsData } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/colors`);
      return data.colors || [];
    },
  });

  // Fetch lens types from API
  const { data: lensTypesData } = useQuery({
    queryKey: ["lens-types"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/lens-types`);
      return data.lensTypes || [];
    },
  });

  // Fetch frame materials from API
  const { data: frameMaterialsData } = useQuery({
    queryKey: ["frame-materials"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/frame-materials`);
      return data.frameMaterials || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (productData) => {
      const { data } = await axios.post(`${API_URL}/products`, productData);
      return data;
    },
    onSuccess: () => {
      toast.success("Product created successfully!");
      navigate("/admin/products");
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to create product"),
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setImagePreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";
    if (!form.price || Number(form.price) <= 0)
      newErrors.price = "Price must be greater than 0";
    if (form.discountedPrice) {
      const dp = Number(form.discountedPrice);
      const p = Number(form.price);
      if (dp <= 0) newErrors.discountedPrice = "Must be greater than 0";
      else if (dp >= p)
        newErrors.discountedPrice = "Must be less than original price";
    }
    if (form.stock === "" || form.stock === null || form.stock === undefined) {
      newErrors.stock = "Stock is required";
    } else if (Number(form.stock) < 0) {
      newErrors.stock = "Stock cannot be negative";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    if (field === "stock") {
      const numValue = Number(value);
      if (value === "" || value === null || value === undefined) {
        setForm({ ...form, [field]: value });
      } else if (numValue < 0) {
        setForm({ ...form, [field]: "0" });
        toast.error("Stock cannot be negative");
        return;
      } else {
        setForm({ ...form, [field]: value });
      }
    } else {
      setForm({ ...form, [field]: value });
    }
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    setUploading(true);

    let uploadedImages = [];
    if (imageFiles.length > 0) {
      try {
        const fd = new FormData();
        imageFiles.forEach((file) => fd.append("images", file));

        console.log("Uploading images...", imageFiles.length);

        const { data } = await axios.post(`${API_URL}/upload/multiple`, fd, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 seconds timeout
        });

        console.log("Upload response:", data);

        uploadedImages = data.images.map((img, i) => ({
          url: img.url,
          alt: form.name,
          isMain: i === 0,
        }));
      } catch (error) {
        console.error("Upload error:", error);
        // Check if it's a network error
        if (error.code === "ERR_NETWORK") {
          toast.error(
            "Network error. Please check your connection and try again.",
          );
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Image upload failed. Please try again.");
        }
        setUploading(false);
        return;
      }
    }

    const specifications = [];
    if (form.frameWidth)
      specifications.push({
        name: "Frame Width",
        value: `${form.frameWidth} mm`,
      });
    if (form.lensWidth)
      specifications.push({
        name: "Lens Width",
        value: `${form.lensWidth} mm`,
      });
    if (form.frameHeight)
      specifications.push({
        name: "Frame Height",
        value: `${form.frameHeight} mm`,
      });
    if (form.bridge)
      specifications.push({ name: "Bridge", value: `${form.bridge} mm` });
    if (form.temple)
      specifications.push({
        name: "Temple Length",
        value: `${form.temple} mm`,
      });

    const productData = {
      ...form,
      price: Number(form.price),
      comparePrice: form.discountedPrice
        ? Number(form.discountedPrice)
        : undefined,
      stock: Number(form.stock),
      images: uploadedImages,
      variants: variants,
      specifications: specifications.length > 0 ? specifications : undefined,
    };
    delete productData.discountedPrice;

    createMutation.mutate(productData);
    setUploading(false);
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition ${
      errors[field]
        ? "border-red-300 bg-red-50"
        : "border-gray-200 focus:border-[#3D96EB]"
    }`;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text">Add New Product</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          noValidate
        >
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputClass("name")}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 inline" />{" "}
                {errors.name}
              </p>
            )}
          </div>
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              className={inputClass("sku")}
              placeholder="e.g. RB-001"
            />
          </div>
          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={inputClass("description")}
              placeholder="Enter product description..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 inline" />{" "}
                {errors.description}
              </p>
            )}
          </div>
          {/* Categories - SearchableMultiSelect */}
          <div className="md:col-span-2">
            <SearchableMultiSelect
              label="Categories (Multi Select)"
              options={categories || []}
              selectedValues={
                form.category ? form.category.split(",").filter(Boolean) : []
              }
              onChange={(values) => handleChange("category", values.join(","))}
              placeholder="Search categories..."
              renderOption={(cat) => cat.name}
              getValue={(cat) => cat._id}
            />
          </div>
          {/* Brand - SearchableSingleSelect */}
          <div className="md:col-span-2">
            <SearchableSingleSelect
              label="Brand (Optional)"
              options={brands || []}
              value={form.brand}
              onChange={(val) => handleChange("brand", val)}
              placeholder="Search brands..."
              renderOption={(brand) => brand.name}
              getValue={(brand) => brand._id}
            />
          </div>
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.productType}
              onChange={(e) => handleChange("productType", e.target.value)}
              className={inputClass("productType")}
            >
              <option value="eyeglasses">Eyeglasses</option>
              <option value="sunglasses">Sunglasses</option>
              <option value="contactlens">Contact Lens</option>
            </select>
          </div>
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { v: "men", l: "👨 Men" },
                { v: "women", l: "👩 Women" },
                { v: "kids", l: "👶 Kids" },
                { v: "unisex", l: "👤 Unisex" },
              ].map((opt) => {
                const sel = form.gender
                  ? form.gender.split(",").filter(Boolean)
                  : [];
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => {
                      const current = form.gender
                        ? form.gender.split(",").filter(Boolean)
                        : [];
                      let updated = current.includes(opt.v)
                        ? current.filter((v) => v !== opt.v)
                        : [...current, opt.v];
                      handleChange("gender", updated.join(","));
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      sel.includes(opt.v)
                        ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Original Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className={inputClass("price")}
              placeholder="e.g. 1999"
              min="0"
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 inline" />{" "}
                {errors.price}
              </p>
            )}
          </div>
          {/* Discounted Price */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Discounted Price (₹)
            </label>
            <input
              type="number"
              value={form.discountedPrice}
              onChange={(e) => handleChange("discountedPrice", e.target.value)}
              className={inputClass("discountedPrice")}
              placeholder="e.g. 1499"
              min="0"
            />
            {errors.discountedPrice && (
              <p className="text-red-500 text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 inline" />{" "}
                {errors.discountedPrice}
              </p>
            )}
            {form.price &&
              form.discountedPrice &&
              !errors.discountedPrice &&
              Number(form.discountedPrice) < Number(form.price) && (
                <p className="text-green-600 text-xs mt-1">
                  {Math.round(
                    ((Number(form.price) - Number(form.discountedPrice)) /
                      Number(form.price)) *
                      100,
                  )}
                  % off
                </p>
              )}
          </div>
          {/* Variants Section */}
          <div className="md:col-span-2">
            <VariantManager
              variants={variants}
              onVariantsChange={setVariants}
              productType={form.productType}
            />
          </div>
          {/* Stock */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className={inputClass("stock")}
              placeholder="e.g. 10"
              min="0"
              step="1"
            />
            {errors.stock && (
              <p className="text-red-500 text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 inline" />{" "}
                {errors.stock}
              </p>
            )}
            <p className="text-xs text-text-light mt-1">
              Set to 0 for out of stock
            </p>
          </div>
          {/* Frame Shape - Using SearchableMultiSelect */}
          <div>
            <SearchableMultiSelect
              label="Frame Shape"
              options={shapesData || []}
              selectedValues={
                form.frameShape
                  ? form.frameShape.split(",").filter(Boolean)
                  : []
              }
              onChange={(values) =>
                handleChange("frameShape", values.join(","))
              }
              placeholder="Search frame shapes..."
              renderOption={(shape) => shape.name}
              getValue={(shape) => shape.name}
              maxHeight="max-h-32"
            />
          </div>
          {/* Frame Material - Using SearchableMultiSelect */}
          <div>
            <SearchableMultiSelect
              label="Frame Material"
              options={frameMaterialsData || []}
              selectedValues={
                form.frameMaterial
                  ? form.frameMaterial.split(",").filter(Boolean)
                  : []
              }
              onChange={(values) =>
                handleChange("frameMaterial", values.join(","))
              }
              placeholder="Search frame materials..."
              renderOption={(mat) => mat.name}
              getValue={(mat) => mat.name}
              maxHeight="max-h-32"
            />
          </div>
          {/* Frame Color - Using SearchableMultiSelect */}
          <div>
            <SearchableMultiSelect
              label="Frame Color"
              options={colorsData || []}
              selectedValues={
                form.frameColor
                  ? form.frameColor.split(",").filter(Boolean)
                  : []
              }
              onChange={(values) => {
                handleChange("frameColor", values.join(","));
              }}
              placeholder="Search colors..."
              renderOption={(color) => (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: color.hexCode || "#000" }}
                  />
                  {color.name}
                </span>
              )}
              getValue={(color) => color.name}
              maxHeight="max-h-32"
            />
          </div>
          {/* Lens Type - Using SearchableMultiSelect */}
          <div>
            <SearchableMultiSelect
              label="Lens Type"
              options={lensTypesData || []}
              selectedValues={
                form.lensType ? form.lensType.split(",").filter(Boolean) : []
              }
              onChange={(values) => handleChange("lensType", values.join(","))}
              placeholder="Search lens types..."
              renderOption={(lens) => lens.name}
              getValue={(lens) => lens.name}
              maxHeight="max-h-32"
            />
          </div>
          {/* Frame Dimensions */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-3">
              Frame Dimensions (mm)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Frame Width
                </label>
                <input
                  type="number"
                  value={form.frameWidth}
                  onChange={(e) => handleChange("frameWidth", e.target.value)}
                  className={inputClass("frameWidth")}
                  placeholder="e.g. 140"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Lens Width
                </label>
                <input
                  type="number"
                  value={form.lensWidth}
                  onChange={(e) => handleChange("lensWidth", e.target.value)}
                  className={inputClass("lensWidth")}
                  placeholder="e.g. 52"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Frame Height
                </label>
                <input
                  type="number"
                  value={form.frameHeight}
                  onChange={(e) => handleChange("frameHeight", e.target.value)}
                  className={inputClass("frameHeight")}
                  placeholder="e.g. 45"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Bridge
                </label>
                <input
                  type="number"
                  value={form.bridge}
                  onChange={(e) => handleChange("bridge", e.target.value)}
                  className={inputClass("bridge")}
                  placeholder="e.g. 18"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Temple
                </label>
                <input
                  type="number"
                  value={form.temple}
                  onChange={(e) => handleChange("temple", e.target.value)}
                  className={inputClass("temple")}
                  placeholder="e.g. 145"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          {/* Product Images */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Product Images
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border"
                >
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#3D96EB] hover:bg-[#EBF4FC] transition">
                <PhotoIcon className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Add</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {/* Product Flags */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Product Flags
            </label>
            <p className="text-xs text-text-light mb-3">
              🏷️ Flags control homepage sections: Featured=Flash Sales,
              Trending=Customer Loved, New Arrival=New Arrivals, Best
              Seller=Best Sellers.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { k: "isFeatured", l: "⭐ Featured" },
                { k: "isTrending", l: "🔥 Trending" },
                { k: "isNewArrival", l: "🆕 New Arrival" },
                { k: "isBestSeller", l: "🏆 Best Seller" },
              ].map((f) => (
                <label
                  key={f.k}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[f.k]}
                    onChange={(e) => handleChange(f.k, e.target.checked)}
                    className="w-4 h-4 text-[#3D96EB] rounded"
                  />
                  <span className="text-sm">{f.l}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Submit */}
          <div className="md:col-span-2 flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={uploading || createMutation.isPending}
              className="btn-primary text-sm"
            >
              {uploading
                ? "Uploading..."
                : createMutation.isPending
                  ? "Creating..."
                  : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
