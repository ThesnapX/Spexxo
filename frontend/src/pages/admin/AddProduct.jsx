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
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AddProduct = () => {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    category: "",
    brand: "",
    gender: "unisex",
    productType: "eyeglasses",
    frameShape: "",
    frameMaterial: "",
    frameColor: "",
    frameWidth: "",
    lensWidth: "",
    frameHeight: "",
    bridge: "",
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
      return data.categories;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands;
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

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!form.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!form.category) {
      newErrors.category = "Please select a category";
    }
    if (!form.price || Number(form.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    // Discounted price validation
    if (form.discountedPrice) {
      const discountedPrice = Number(form.discountedPrice);
      const price = Number(form.price);

      if (discountedPrice <= 0) {
        newErrors.discountedPrice = "Discounted price must be greater than 0";
      } else if (discountedPrice >= price) {
        newErrors.discountedPrice =
          "Discounted price must be less than original price";
      }

      // Discount shouldn't be more than 90%
      if (price > 0 && discountedPrice > 0) {
        const discountPercent = ((price - discountedPrice) / price) * 100;
        if (discountPercent > 90) {
          newErrors.discountedPrice = "Discount cannot be more than 90%";
        }
      }
    }

    // Stock validation
    if (form.stock && Number(form.stock) < 0) {
      newErrors.stock = "Stock cannot be negative";
    }

    // Frame dimension validations (if provided, must be positive)
    if (form.frameWidth && Number(form.frameWidth) <= 0) {
      newErrors.frameWidth = "Must be positive";
    }
    if (form.lensWidth && Number(form.lensWidth) <= 0) {
      newErrors.lensWidth = "Must be positive";
    }
    if (form.frameHeight && Number(form.frameHeight) <= 0) {
      newErrors.frameHeight = "Must be positive";
    }
    if (form.bridge && Number(form.bridge) <= 0) {
      newErrors.bridge = "Must be positive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
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
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("images", file));
      try {
        const { data } = await axios.post(
          `${API_URL}/upload/multiple`,
          formData,
        );
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

    // Build specifications array from frame dimensions
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

    // Calculate discount percentage for display
    let discountPercent = 0;
    if (form.discountedPrice && form.price) {
      discountPercent = Math.round(
        ((Number(form.price) - Number(form.discountedPrice)) /
          Number(form.price)) *
          100,
      );
    }

    const productData = {
      ...form,
      price: Number(form.price),
      // Store discounted price as comparePrice in backend (for compatibility)
      comparePrice: form.discountedPrice
        ? Number(form.discountedPrice)
        : undefined,
      stock: Number(form.stock),
      images: uploadedImages,
      specifications: specifications.length > 0 ? specifications : undefined,
    };

    // Remove discountedPrice from the payload (backend uses comparePrice)
    delete productData.discountedPrice;

    createMutation.mutate(productData);
    setUploading(false);
  };

  const inputClass = (fieldName) =>
    `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition ${
      errors[fieldName]
        ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50"
        : "border-gray-200 focus:border-[#3D96EB] focus:ring-[#3D96EB]/20"
    }`;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
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
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" /> {errors.name}
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
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" />{" "}
                {errors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={inputClass("category")}
            >
              <option value="">Select Category</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" /> {errors.category}
              </p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              className={inputClass("brand")}
            >
              <option value="">Select Brand</option>
              {brands?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
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
            <select
              value={form.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              className={inputClass("gender")}
            >
              <option value="unisex">Unisex</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
            </select>
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
              step="0.01"
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" /> {errors.price}
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
              step="0.01"
            />
            {errors.discountedPrice && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" />{" "}
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
            {errors.stock && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" /> {errors.stock}
              </p>
            )}
          </div>

          {/* Frame Shape */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Shape
            </label>
            <select
              value={form.frameShape}
              onChange={(e) => handleChange("frameShape", e.target.value)}
              className={inputClass("frameShape")}
            >
              <option value="">Select</option>
              <option value="rectangle">Rectangle</option>
              <option value="round">Round</option>
              <option value="cat-eye">Cat Eye</option>
              <option value="square">Square</option>
              <option value="oval">Oval</option>
              <option value="aviator">Aviator</option>
              <option value="wayfarer">Wayfarer</option>
            </select>
          </div>

          {/* Frame Material */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Material
            </label>
            <select
              value={form.frameMaterial}
              onChange={(e) => handleChange("frameMaterial", e.target.value)}
              className={inputClass("frameMaterial")}
            >
              <option value="">Select</option>
              <option value="metal">Metal</option>
              <option value="plastic">Plastic</option>
              <option value="acetate">Acetate</option>
              <option value="titanium">Titanium</option>
            </select>
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
              placeholder="e.g. Black, Gold"
            />
          </div>

          {/* Frame Dimensions */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-3">
              Frame Dimensions (mm)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Frame Width
                </label>
                <input
                  type="number"
                  value={form.frameWidth}
                  onChange={(e) => handleChange("frameWidth", e.target.value)}
                  placeholder="e.g. 140"
                  className={inputClass("frameWidth")}
                  min="0"
                  step="0.1"
                />
                {errors.frameWidth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.frameWidth}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Lens Width
                </label>
                <input
                  type="number"
                  value={form.lensWidth}
                  onChange={(e) => handleChange("lensWidth", e.target.value)}
                  placeholder="e.g. 52"
                  className={inputClass("lensWidth")}
                  min="0"
                  step="0.1"
                />
                {errors.lensWidth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lensWidth}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Frame Height
                </label>
                <input
                  type="number"
                  value={form.frameHeight}
                  onChange={(e) => handleChange("frameHeight", e.target.value)}
                  placeholder="e.g. 45"
                  className={inputClass("frameHeight")}
                  min="0"
                  step="0.1"
                />
                {errors.frameHeight && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.frameHeight}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-text-light mb-1">
                  Bridge
                </label>
                <input
                  type="number"
                  value={form.bridge}
                  onChange={(e) => handleChange("bridge", e.target.value)}
                  placeholder="e.g. 18"
                  className={inputClass("bridge")}
                  min="0"
                  step="0.1"
                />
                {errors.bridge && (
                  <p className="text-red-500 text-xs mt-1">{errors.bridge}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-text-light mt-2">
              All measurements in millimeters (mm)
            </p>
          </div>

          {/* Lens Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Lens Type</label>
            <select
              value={form.lensType}
              onChange={(e) => handleChange("lensType", e.target.value)}
              className={inputClass("lensType")}
            >
              <option value="">Select</option>
              <option value="single-vision">Single Vision</option>
              <option value="bifocal">Bifocal</option>
              <option value="progressive">Progressive</option>
              <option value="blue-cut">Blue Cut</option>
              <option value="photochromic">Photochromic</option>
              <option value="polarized">Polarized</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Product Images
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg text-xs"
                  >
                    <XMarkIcon className="w-3 h-3" />
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
            <p className="text-xs text-text-light">
              Upload product images. First image will be the main image.
            </p>
          </div>

          {/* Product Flags */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Product Flags
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "isFeatured", label: "Featured" },
                { key: "isTrending", label: "Trending" },
                { key: "isNewArrival", label: "New Arrival" },
                { key: "isBestSeller", label: "Best Seller" },
              ].map((flag) => (
                <label
                  key={flag.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[flag.key]}
                    onChange={(e) => handleChange(flag.key, e.target.checked)}
                    className="w-4 h-4 text-[#3D96EB] rounded focus:ring-[#3D96EB]"
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
                ? "Uploading Images..."
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
