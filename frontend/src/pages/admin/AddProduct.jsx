import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AddProduct = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [customShape, setCustomShape] = useState("");
  const [customLensType, setCustomLensType] = useState("");
  const [customMaterial, setCustomMaterial] = useState("");

  // Search states
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Quick Add Popup states
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [showBrandPopup, setShowBrandPopup] = useState(false);
  const [quickCategoryForm, setQuickCategoryForm] = useState({ name: "" });
  const [quickBrandForm, setQuickBrandForm] = useState({
    name: "",
    description: "",
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

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

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categories`);
      return data.categories || [];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands || [];
    },
  });

  // Filter categories by search
  const filteredCategories =
    categories?.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
    ) || [];

  // Filter brands by search
  const filteredBrands =
    brands?.filter((b) =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase()),
    ) || [];

  // Show limited or all
  const displayedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, 6);
  const displayedBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, 8);

  // Quick Save Category
  const handleQuickSaveCategory = async (e) => {
    e.preventDefault();
    if (!quickCategoryForm.name.trim()) return;
    setSavingCategory(true);
    try {
      await axios.post(`${API_URL}/categories`, quickCategoryForm);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category added!");
      setQuickCategoryForm({ name: "" });
      setShowCategoryPopup(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  };

  // Quick Save Brand
  const handleQuickSaveBrand = async (e) => {
    e.preventDefault();
    if (!quickBrandForm.name.trim()) return;
    setSavingBrand(true);
    try {
      await axios.post(`${API_URL}/brands`, quickBrandForm);
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("Brand added!");
      setQuickBrandForm({ name: "", description: "" });
      setShowBrandPopup(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add brand");
    } finally {
      setSavingBrand(false);
    }
  };

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
      if (dp <= 0)
        newErrors.discountedPrice = "Discounted price must be greater than 0";
      else if (dp >= p)
        newErrors.discountedPrice =
          "Discounted price must be less than original price";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
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

  const addCustomValue = (field, customValue, setCustomFn) => {
    if (!customValue.trim()) return;
    const current = form[field] ? form[field].split(",").filter(Boolean) : [];
    if (!current.includes(customValue.trim())) {
      setForm({ ...form, [field]: [...current, customValue.trim()].join(",") });
    }
    setCustomFn("");
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
        ? "border-red-300 bg-red-50 focus:border-red-500"
        : "border-gray-200 focus:border-[#3D96EB]"
    }`;

  const MultiSelectWithCustom = ({
    label,
    options,
    field,
    customValue,
    setCustomFn,
    placeholder,
  }) => {
    const selected = form[field] ? form[field].split(",").filter(Boolean) : [];
    return (
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {options.map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleMultiSelect(field, value)}
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  isSelected
                    ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomFn(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomValue(field, customValue, setCustomFn);
              }
            }}
          />
          <button
            type="button"
            onClick={() => addCustomValue(field, customValue, setCustomFn)}
            className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

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

          {/* Category - Multi Select with Search + Quick Add */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">
                Categories{" "}
                <span className="text-gray-400 text-xs">
                  (Optional - Multi Select)
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryPopup(true)}
                className="text-xs text-[#3D96EB] hover:underline flex items-center gap-1"
              >
                <PlusCircleIcon className="w-4 h-4" /> Add Category
              </button>
            </div>
            {/* Search */}
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3D96EB]"
              />
            </div>
            {/* Category Pills */}
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
            {categorySearch && filteredCategories.length === 0 && (
              <p className="text-xs text-text-light mt-1">
                No categories found.{" "}
                <button
                  type="button"
                  onClick={() => setShowCategoryPopup(true)}
                  className="text-[#3D96EB] hover:underline"
                >
                  Add one?
                </button>
              </p>
            )}
          </div>

          {/* Brand - Search + Quick Add */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">
                Brand <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowBrandPopup(true)}
                className="text-xs text-[#3D96EB] hover:underline flex items-center gap-1"
              >
                <PlusCircleIcon className="w-4 h-4" /> Add Brand
              </button>
            </div>
            {/* Search */}
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3D96EB]"
              />
            </div>
            {/* Brand Pills */}
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
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

          {/* Gender - Multi Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { value: "men", label: "👨 Men" },
                { value: "women", label: "👩 Women" },
                { value: "kids", label: "👶 Kids" },
                { value: "unisex", label: "👤 Unisex" },
              ].map((opt) => {
                const selected = form.gender
                  ? form.gender.split(",").filter(Boolean)
                  : [];
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleMultiSelect("gender", opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${isSelected ? "border-[#3D96EB] bg-[#EBF4FC] text-[#3D96EB] font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {opt.label}
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

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className={inputClass("stock")}
              placeholder="e.g. 10"
              min="0"
            />
          </div>

          {/* Frame Shape */}
          <div className="md:col-span-2">
            <MultiSelectWithCustom
              label="Frame Shape"
              options={[
                "Rectangle",
                "Round",
                "Cat Eye",
                "Square",
                "Oval",
                "Aviator",
                "Wayfarer",
                "Rimless",
                "Oversized",
                "Geometric",
              ]}
              field="frameShape"
              customValue={customShape}
              setCustomFn={setCustomShape}
              placeholder="Add custom frame shape..."
            />
          </div>

          {/* Frame Material */}
          <div className="md:col-span-2">
            <MultiSelectWithCustom
              label="Frame Material"
              options={[
                "Metal",
                "Plastic",
                "Acetate",
                "Titanium",
                "Stainless Steel",
                "TR90",
                "Wood",
                "Flexible",
                "Beta-Titanium",
              ]}
              field="frameMaterial"
              customValue={customMaterial}
              setCustomFn={setCustomMaterial}
              placeholder="Add custom material..."
            />
          </div>

          {/* Frame Color */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Color
            </label>
            <input
              type="text"
              value={form.frameColor}
              onChange={(e) => handleChange("frameColor", e.target.value)}
              className={inputClass("frameColor")}
              placeholder="e.g. Black, Gold, Tortoise"
            />
          </div>

          {/* Lens Type */}
          <div className="md:col-span-2">
            <MultiSelectWithCustom
              label="Lens Type"
              options={[
                "Single Vision",
                "Bifocal",
                "Progressive",
                "Blue Cut",
                "UV Protection",
                "Polarized",
                "Anti-Glare",
                "HD Vision",
              ]}
              field="lensType"
              customValue={customLensType}
              setCustomFn={setCustomLensType}
              placeholder="Add custom lens type..."
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
                  Temple Length
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
            <p className="text-xs text-text-light mt-2">
              All measurements in millimeters (mm)
            </p>
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
              🏷️ <strong>Product Flags</strong> control where this product
              appears on the homepage. Featured = Flash Sales, Trending =
              Customer Loved, New Arrival = New Arrivals, Best Seller = Best
              Sellers section.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "isFeatured", label: "⭐ Featured" },
                { key: "isTrending", label: "🔥 Trending" },
                { key: "isNewArrival", label: "🆕 New Arrival" },
                { key: "isBestSeller", label: "🏆 Best Seller" },
              ].map((flag) => (
                <label
                  key={flag.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[flag.key]}
                    onChange={(e) => handleChange(flag.key, e.target.checked)}
                    className="w-4 h-4 text-[#3D96EB] rounded"
                  />
                  <span className="text-sm">{flag.label}</span>
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

      {/* ============ QUICK ADD CATEGORY POPUP ============ */}
      {showCategoryPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowCategoryPopup(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Category</h3>
              <button onClick={() => setShowCategoryPopup(false)}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickSaveCategory} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={quickCategoryForm.name}
                  onChange={(e) =>
                    setQuickCategoryForm({
                      ...quickCategoryForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="e.g. Men Eyeglasses"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingCategory}
                className="btn-primary text-sm w-full"
              >
                {savingCategory ? "Adding..." : "Add Category"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============ QUICK ADD BRAND POPUP ============ */}
      {showBrandPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowBrandPopup(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Brand</h3>
              <button onClick={() => setShowBrandPopup(false)}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickSaveBrand} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={quickBrandForm.name}
                  onChange={(e) =>
                    setQuickBrandForm({
                      ...quickBrandForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={quickBrandForm.description}
                  onChange={(e) =>
                    setQuickBrandForm({
                      ...quickBrandForm,
                      description: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={savingBrand}
                className="btn-primary text-sm w-full"
              >
                {savingBrand ? "Adding..." : "Add Brand"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
