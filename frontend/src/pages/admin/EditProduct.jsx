// frontend/src/pages/admin/EditProduct.jsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import VariantManager from "../../components/admin/VariantManager";
import SearchableMultiSelect from "../../components/admin/SearchableMultiSelect";
import SearchableSingleSelect from "../../components/admin/SearchableSingleSelect";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);
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

  // Fetch product data
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/${id}`);
      return data.product || null;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Initialize form from product data
  useEffect(() => {
    if (productData && !formInitialized) {
      let catStr = "";
      if (productData.categories && Array.isArray(productData.categories)) {
        catStr = productData.categories.map((c) => c._id).join(",");
      } else if (productData.category) {
        if (typeof productData.category === "string") {
          catStr = productData.category;
        } else if (
          typeof productData.category === "object" &&
          productData.category._id
        ) {
          catStr = productData.category._id;
        }
      }

      let brandStr = "";
      if (productData.brand) {
        if (typeof productData.brand === "string") {
          brandStr = productData.brand;
        } else if (
          typeof productData.brand === "object" &&
          productData.brand._id
        ) {
          brandStr = productData.brand._id;
        }
      }

      // Set variants from product data
      if (productData.variants && Array.isArray(productData.variants)) {
        setVariants(productData.variants);
      }

      setForm({
        name: productData.name || "",
        description: productData.description || "",
        price: productData.price || "",
        discountedPrice: productData.comparePrice || "",
        category: catStr,
        brand: brandStr,
        gender: productData.gender || "",
        productType: productData.productType || "eyeglasses",
        frameShape: productData.frameShape || "",
        frameMaterial: productData.frameMaterial || "",
        frameColor: productData.frameColor || "",
        frameWidth:
          productData.specifications
            ?.find((s) => s.name === "Frame Width")
            ?.value?.replace(" mm", "") || "",
        lensWidth:
          productData.specifications
            ?.find((s) => s.name === "Lens Width")
            ?.value?.replace(" mm", "") || "",
        frameHeight:
          productData.specifications
            ?.find((s) => s.name === "Frame Height")
            ?.value?.replace(" mm", "") || "",
        bridge:
          productData.specifications
            ?.find((s) => s.name === "Bridge")
            ?.value?.replace(" mm", "") || "",
        temple:
          productData.specifications
            ?.find((s) => s.name === "Temple Length")
            ?.value?.replace(" mm", "") || "",
        lensType: productData.lensType || "",
        stock:
          productData.stock !== undefined && productData.stock !== null
            ? String(productData.stock)
            : "10",
        isFeatured: productData.isFeatured || false,
        isTrending: productData.isTrending || false,
        isNewArrival: productData.isNewArrival || false,
        isBestSeller: productData.isBestSeller || false,
        sku: productData.sku || "",
      });
      setExistingImages(productData.images || []);
      setFormInitialized(true);
    }
  }, [productData, formInitialized]);

  const updateMutation = useMutation({
    mutationFn: async (productData) => {
      const { data } = await axios.put(
        `${API_URL}/products/${id}`,
        productData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail", id] });
      queryClient.invalidateQueries({
        queryKey: ["product", productData?.slug],
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["mega-menu-products"] });
      queryClient.invalidateQueries({ queryKey: ["smart-related"] });

      toast.success("Product updated!");
      navigate("/admin/products");
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to update"),
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

  const removeExistingImage = (index) =>
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  const removeNewImage = (index) => {
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
      if (dp <= 0) newErrors.discountedPrice = "Must be > 0";
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
      toast.error("Please fix errors");
      return;
    }
    setUploading(true);
    let allImages = [...existingImages];
    if (imageFiles.length > 0) {
      const fd = new FormData();
      imageFiles.forEach((f) => fd.append("images", f));
      try {
        const { data } = await axios.post(`${API_URL}/upload/multiple`, fd);
        const uploadedImages = data.images.map((img, i) => ({
          url: img.url,
          alt: form.name,
          isMain: existingImages.length === 0 && i === 0,
        }));
        allImages = [...allImages, ...uploadedImages];
      } catch (error) {
        toast.error("Upload failed");
        setUploading(false);
        return;
      }
    }
    const specs = [];
    if (form.frameWidth)
      specs.push({ name: "Frame Width", value: `${form.frameWidth} mm` });
    if (form.lensWidth)
      specs.push({ name: "Lens Width", value: `${form.lensWidth} mm` });
    if (form.frameHeight)
      specs.push({ name: "Frame Height", value: `${form.frameHeight} mm` });
    if (form.bridge) specs.push({ name: "Bridge", value: `${form.bridge} mm` });
    if (form.temple)
      specs.push({ name: "Temple Length", value: `${form.temple} mm` });

    const pd = {
      ...form,
      price: Number(form.price),
      comparePrice: form.discountedPrice
        ? Number(form.discountedPrice)
        : undefined,
      stock: Number(form.stock),
      images: allImages,
      variants: variants,
      specifications: specs.length > 0 ? specs : undefined,
    };
    delete pd.discountedPrice;
    updateMutation.mutate(pd);
    setUploading(false);
  };

  const getInputClass = (field) => {
    return `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition ${
      errors[field]
        ? "border-red-300 bg-red-50"
        : "border-gray-200 focus:border-[#3D96EB]"
    }`;
  };

  // Loading state
  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-light">Loading product...</p>
      </div>
    );
  }

  // Not found state
  if (!productData) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold">Product Not Found</p>
        <button
          onClick={() => navigate("/admin/products")}
          className="btn-primary mt-4 text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  // Main render
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text">Edit Product</h1>
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
              className={getInputClass("name")}
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
              className={getInputClass("sku")}
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
              className={getInputClass("description")}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 inline" />{" "}
                {errors.description}
              </p>
            )}
          </div>

          {/* Categories - Using SearchableMultiSelect */}
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

          {/* Brand - Using SearchableSingleSelect */}
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
              className={getInputClass("productType")}
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
              className={getInputClass("price")}
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
              className={getInputClass("discountedPrice")}
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
              className={getInputClass("stock")}
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
              onChange={(values) =>
                handleChange("frameColor", values.join(","))
              }
              placeholder="Search colors..."
              renderOption={(color) => (
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
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
                  className={getInputClass("frameWidth")}
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
                  className={getInputClass("lensWidth")}
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
                  className={getInputClass("frameHeight")}
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
                  className={getInputClass("bridge")}
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
                  className={getInputClass("temple")}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Images</label>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((img, i) => (
                <div
                  key={`e-${i}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imagePreviews.map((p, i) => (
                <div
                  key={`n-${i}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border"
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
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
              🏷️ Flags control homepage sections.
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
              disabled={uploading || updateMutation.isPending}
              className="btn-primary text-sm"
            >
              {uploading
                ? "Uploading..."
                : updateMutation.isPending
                  ? "Updating..."
                  : "Update Product"}
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

export default EditProduct;
