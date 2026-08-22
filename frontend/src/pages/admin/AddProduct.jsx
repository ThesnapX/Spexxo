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
  PencilIcon,
  TrashIcon,
  CubeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import SearchableMultiSelect from "../../components/admin/SearchableMultiSelect";
import SearchableSingleSelect from "../../components/admin/SearchableSingleSelect";
import VariantForm from "../../components/admin/VariantForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AddProduct = () => {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [variants, setVariants] = useState([]);
  const [productType, setProductType] = useState("simple");
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    category: "",
    brand: "",
    gender: "",
    productCategory: "eyeglasses",
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

  // Add variant functions
  const handleAddVariant = (variantData) => {
    setVariants([...variants, variantData]);
    setShowVariantForm(false);
    toast.success("Variant added!");
  };

  const handleEditVariant = (index) => {
    setEditingVariantIndex(index);
    setShowVariantForm(true);
  };

  const handleUpdateVariant = (variantData) => {
    const updatedVariants = [...variants];
    updatedVariants[editingVariantIndex] = variantData;
    setVariants(updatedVariants);
    setShowVariantForm(false);
    setEditingVariantIndex(null);
    toast.success("Variant updated!");
  };

  const handleDeleteVariant = (index) => {
    if (window.confirm("Delete this variant?")) {
      setVariants(variants.filter((_, i) => i !== index));
      toast.success("Variant deleted");
    }
  };

  const openVariantForm = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingVariantIndex(null);
    setShowVariantForm(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";

    if (productType === "simple") {
      if (!form.price || Number(form.price) <= 0)
        newErrors.price = "Price must be greater than 0";
      if (form.discountedPrice) {
        const dp = Number(form.discountedPrice);
        const p = Number(form.price);
        if (dp <= 0) newErrors.discountedPrice = "Must be greater than 0";
        else if (dp >= p)
          newErrors.discountedPrice = "Must be less than original price";
      }
      if (
        form.stock === "" ||
        form.stock === null ||
        form.stock === undefined
      ) {
        newErrors.stock = "Stock is required";
      } else if (Number(form.stock) < 0) {
        newErrors.stock = "Stock cannot be negative";
      }
    } else {
      if (variants.length === 0) {
        newErrors.variants = "At least one variant is required";
      }
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

    let productImages = [];
    let finalVariants = [];

    if (productType === "variable") {
      // For variable products, first upload any variant images
      // Process each variant to ensure images are uploaded
      for (const variant of variants) {
        let variantImages = variant.images || [];

        // If variant has image files that need uploading, handle them
        if (variant.imageFiles && variant.imageFiles.length > 0) {
          try {
            const fd = new FormData();
            variant.imageFiles.forEach((file) => fd.append("images", file));
            const { data } = await axios.post(`${API_URL}/upload/multiple`, fd);
            const uploadedImages = data.images.map((img) => ({
              url: img.url,
              alt: variant.name,
            }));
            variantImages = [...variantImages, ...uploadedImages];
          } catch (error) {
            toast.error(`Failed to upload images for variant: ${variant.name}`);
            setUploading(false);
            return;
          }
        }

        finalVariants.push({
          name: variant.name,
          sku: variant.sku || undefined,
          price: parseFloat(variant.price),
          comparePrice: variant.comparePrice
            ? parseFloat(variant.comparePrice)
            : undefined,
          stock: parseInt(variant.stock) || 0,
          color: variant.color || null,
          frameShape: variant.frameShape || "",
          frameMaterial: variant.frameMaterial || "",
          lensType: variant.lensType || "",
          frameColor: variant.frameColor || "",
          frameWidth: variant.frameWidth
            ? parseFloat(variant.frameWidth)
            : undefined,
          lensWidth: variant.lensWidth
            ? parseFloat(variant.lensWidth)
            : undefined,
          frameHeight: variant.frameHeight
            ? parseFloat(variant.frameHeight)
            : undefined,
          bridge: variant.bridge ? parseFloat(variant.bridge) : undefined,
          images: variantImages,
          isDefault: variant.isDefault || false,
          isActive: variant.isActive !== false,
        });
      }

      // Set product images from the first variant's images
      if (finalVariants.length > 0 && finalVariants[0].images.length > 0) {
        productImages = finalVariants[0].images;
      }
    } else {
      // For simple products, upload images
      if (imageFiles.length > 0) {
        try {
          const fd = new FormData();
          imageFiles.forEach((file) => fd.append("images", file));
          const { data } = await axios.post(`${API_URL}/upload/multiple`, fd);
          productImages = data.images.map((img, i) => ({
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
    }

    const productData = {
      ...form,
      price: productType === "simple" ? Number(form.price) : undefined,
      comparePrice:
        productType === "simple" && form.discountedPrice
          ? Number(form.discountedPrice)
          : undefined,
      stock: productType === "simple" ? Number(form.stock) : undefined,
      images: productImages, // Now properly set from variants
      variants: productType === "variable" ? finalVariants : undefined,
      brand: form.brand || null,
      category: form.category || null,
      productType: productType,
      productCategory: form.productCategory,
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-2">
              Product Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => setProductType("simple")}
                className={`p-4 rounded-xl border-2 transition text-center ${
                  productType === "simple"
                    ? "border-primary bg-[#EBF4FC] text-primary"
                    : "border-gray-200 hover:border-gray-300 text-text"
                }`}
              >
                <CubeIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Simple Product</p>
                <p className="text-xs text-text-light mt-1">
                  One variant with single price & stock
                </p>
              </button>
              <button
                type="button"
                onClick={() => setProductType("variable")}
                className={`p-4 rounded-xl border-2 transition text-center ${
                  productType === "variable"
                    ? "border-primary bg-[#EBF4FC] text-primary"
                    : "border-gray-200 hover:border-gray-300 text-text"
                }`}
              >
                <Squares2X2Icon className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Variable Product</p>
                <p className="text-xs text-text-light mt-1">
                  Multiple variants with different prices & stocks
                </p>
              </button>
            </div>
            {errors.variants && (
              <p className="text-red-500 text-xs mt-2">{errors.variants}</p>
            )}
          </div>

          {/* Common Fields - Always shown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
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
          </div>

          <div>
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
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Categories & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SearchableMultiSelect
                label="Categories (Multi Select)"
                options={categories || []}
                selectedValues={
                  form.category ? form.category.split(",").filter(Boolean) : []
                }
                onChange={(values) =>
                  handleChange("category", values.join(","))
                }
                placeholder="Search categories..."
                renderOption={(cat) => cat.name}
                getValue={(cat) => cat._id}
              />
            </div>
            <div>
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
          </div>

          {/* Gender & Product Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.productCategory}
                onChange={(e) =>
                  handleChange("productCategory", e.target.value)
                }
                className={inputClass("productCategory")}
              >
                <option value="eyeglasses">Eyeglasses</option>
                <option value="sunglasses">Sunglasses</option>
                <option value="contactlens">Contact Lens</option>
              </select>
            </div>
          </div>

          {/* SIMPLE PRODUCT FIELDS */}
          {productType === "simple" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price <span className="text-red-500">*</span>
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
                    <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Discounted Price
                  </label>
                  <input
                    type="number"
                    value={form.discountedPrice}
                    onChange={(e) =>
                      handleChange("discountedPrice", e.target.value)
                    }
                    className={inputClass("discountedPrice")}
                    placeholder="e.g. 1499"
                    min="0"
                  />
                  {errors.discountedPrice && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.discountedPrice}
                    </p>
                  )}
                </div>
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
                    <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
                  )}
                </div>
              </div>

              {/* Simple Product Attributes */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <SearchableMultiSelect
                    label="Lens Type"
                    options={lensTypesData || []}
                    selectedValues={
                      form.lensType
                        ? form.lensType.split(",").filter(Boolean)
                        : []
                    }
                    onChange={(values) =>
                      handleChange("lensType", values.join(","))
                    }
                    placeholder="Search lens types..."
                    renderOption={(lens) => lens.name}
                    getValue={(lens) => lens.name}
                    maxHeight="max-h-32"
                  />
                </div>
                <div>
                  <SearchableMultiSelect
                    label="Frame Color"
                    options={colorsData || []}
                    selectedValues={
                      form.frameColor
                        ? form.frameColor.split(",").filter(Boolean)
                        : []
                    }
                    onChange={(values) =>
                      handleChange("frameColor", values.join(","))
                    }
                    placeholder="Search frame colors..."
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
              </div>

              {/* Simple Product Dimensions */}
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-text-light mb-1">
                    Frame Width
                  </label>
                  <input
                    type="number"
                    value={form.frameWidth}
                    onChange={(e) => handleChange("frameWidth", e.target.value)}
                    className={inputClass("frameWidth")}
                    placeholder="mm"
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
                    placeholder="mm"
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
                    onChange={(e) =>
                      handleChange("frameHeight", e.target.value)
                    }
                    className={inputClass("frameHeight")}
                    placeholder="mm"
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
                    placeholder="mm"
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
                    placeholder="mm"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Simple Product Images */}
              <div>
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
                        onClick={() => {
                          setImageFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          setImagePreviews((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        }}
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
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setImageFiles((prev) => [...prev, ...files]);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onloadend = () =>
                            setImagePreviews((prev) => [
                              ...prev,
                              reader.result,
                            ]);
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* VARIABLE PRODUCT FIELDS */}
          {productType === "variable" && (
            <div className="border rounded-xl p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text">
                  Product Variants ({variants.length})
                </h3>
                <button
                  type="button"
                  onClick={openVariantForm}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" /> Add Variant
                </button>
              </div>

              {showVariantForm && (
                <VariantForm
                  variant={
                    editingVariantIndex !== null
                      ? variants[editingVariantIndex]
                      : null
                  }
                  onSave={
                    editingVariantIndex !== null
                      ? handleUpdateVariant
                      : handleAddVariant
                  }
                  onCancel={() => {
                    setShowVariantForm(false);
                    setEditingVariantIndex(null);
                  }}
                  isEditing={editingVariantIndex !== null}
                />
              )}

              {variants.length > 0 && (
                <div className="space-y-3 mt-4">
                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-4">
                        {variant.images && variant.images.length > 0 && (
                          <img
                            src={variant.images[0].url || variant.images[0]}
                            alt={variant.name}
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                        )}
                        <div>
                          <p className="font-medium text-text">
                            {variant.name}
                          </p>
                          <p className="text-xs text-text-light">
                            SKU: {variant.sku || "N/A"} • Stock: {variant.stock}{" "}
                            • ₹{variant.price}
                            {variant.comparePrice && (
                              <span className="text-gray-400 line-through ml-2">
                                ₹{variant.comparePrice}
                              </span>
                            )}
                          </p>
                          {variant.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditVariant(index)}
                          className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Flags
            </label>
            <p className="text-xs text-text-light mb-3">
              🏷️ Flags control homepage sections: Featured=Flash Sales,
              Trending=Customer Loved. New Arrivals and Best Sellers are
              automatically determined based on product age and sales.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { k: "isFeatured", l: "⭐ Featured" },
                { k: "isTrending", l: "🔥 Trending" },
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
          <div className="flex gap-3 pt-4 border-t">
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
