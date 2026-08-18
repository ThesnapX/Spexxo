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
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AddProduct = () => {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Search states for categories and brands
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

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

  // Filter by search
  const filteredCategories =
    categories?.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
    ) || [];
  const filteredBrands =
    brands?.filter((b) =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase()),
    ) || [];
  const displayedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, 6);
  const displayedBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, 8);

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
    // Stock validation - ensure it's not negative
    if (form.stock === "" || form.stock === null || form.stock === undefined) {
      newErrors.stock = "Stock is required";
    } else if (Number(form.stock) < 0) {
      newErrors.stock = "Stock cannot be negative";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    // For stock field, prevent negative values
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

  const toggleMultiSelect = (field, value) => {
    const current = form[field] ? form[field].split(",").filter(Boolean) : [];
    let updated;
    if (current.includes(value)) {
      updated = current.filter((v) => v !== value);
    } else {
      updated = [...current, value];
    }
    setForm({ ...form, [field]: updated.join(",") });
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
      const fd = new FormData();
      imageFiles.forEach((file) => fd.append("images", file));
      try {
        const { data } = await axios.post(`${API_URL}/upload/multiple`, fd);
        uploadedImages = data.images.map((img, i) => ({
          url: img.url,
          alt: form.name,
          isMain: i === 0,
        }));
      } catch (error) {
        toast.error("Image upload failed");
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

          {/* Categories - Multi Select with Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Categories{" "}
              <span className="text-gray-400 text-xs">
                (Optional - Multi Select)
              </span>
            </label>
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {displayedCategories.map((cat) => {
                const selected = form.category
                  ? form.category.split(",").filter(Boolean)
                  : [];
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => toggleMultiSelect("category", cat._id)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      selected.includes(cat._id)
                        ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {filteredCategories.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs text-[#3D96EB] hover:underline mt-1"
              >
                {showAllCategories
                  ? "Show Less ↑"
                  : `Show All (${filteredCategories.length}) ↓`}
              </button>
            )}
          </div>

          {/* Brand - Single Select with Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Brand <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => handleChange("brand", "")}
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  !form.brand
                    ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                None
              </button>
              {displayedBrands.map((b) => (
                <button
                  key={b._id}
                  type="button"
                  onClick={() =>
                    handleChange("brand", form.brand === b._id ? "" : b._id)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                    form.brand === b._id
                      ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
            {filteredBrands.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllBrands(!showAllBrands)}
                className="text-xs text-[#3D96EB] hover:underline mt-1"
              >
                {showAllBrands
                  ? "Show Less ↑"
                  : `Show All (${filteredBrands.length}) ↓`}
              </button>
            )}
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
                    onClick={() => toggleMultiSelect("gender", opt.v)}
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

          {/* Stock - with min 0 validation */}
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

          {/* Frame Shape - From API */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Shape
            </label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-1">
              {shapesData?.length > 0 ? (
                shapesData.map((shape) => {
                  const sel = form.frameShape
                    ? form.frameShape.split(",").filter(Boolean)
                    : [];
                  return (
                    <button
                      key={shape._id}
                      type="button"
                      onClick={() =>
                        toggleMultiSelect("frameShape", shape.name)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                        sel.includes(shape.name)
                          ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {shape.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-text-light">No shapes available</p>
              )}
            </div>
          </div>

          {/* Frame Material - Static options */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Material
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "Metal",
                "Plastic",
                "Acetate",
                "Titanium",
                "Stainless Steel",
                "TR90",
              ].map((mat) => {
                const sel = form.frameMaterial
                  ? form.frameMaterial.split(",").filter(Boolean)
                  : [];
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => toggleMultiSelect("frameMaterial", mat)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      sel.includes(mat)
                        ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {mat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Color - From API */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Color
            </label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-1">
              {colorsData?.length > 0 ? (
                colorsData.map((color) => {
                  const sel = form.frameColor
                    ? form.frameColor.split(",").filter(Boolean)
                    : [];
                  return (
                    <button
                      key={color._id}
                      type="button"
                      onClick={() =>
                        toggleMultiSelect("frameColor", color.name)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                        sel.includes(color.name)
                          ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1 align-middle"
                        style={{ backgroundColor: color.hexCode || "#000" }}
                      ></span>
                      {color.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-text-light">No colors available</p>
              )}
            </div>
          </div>

          {/* Lens Type - From API */}
          <div>
            <label className="block text-sm font-medium mb-1">Lens Type</label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-1">
              {lensTypesData?.length > 0 ? (
                lensTypesData.map((lensType) => {
                  const sel = form.lensType
                    ? form.lensType.split(",").filter(Boolean)
                    : [];
                  return (
                    <button
                      key={lensType._id}
                      type="button"
                      onClick={() =>
                        toggleMultiSelect("lensType", lensType.name)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                        sel.includes(lensType.name)
                          ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {lensType.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-text-light">
                  No lens types available
                </p>
              )}
            </div>
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
