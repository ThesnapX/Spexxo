import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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

  // Fetch categories and brands
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

  // Fetch product data
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products?limit=100`);
      // Find product by ID from the list
      const product = data.products?.find((p) => p._id === id || p.slug === id);
      if (!product) throw new Error("Product not found");
      return product;
    },
    enabled: !!id,
  });

  // Populate form when product data loads
  useEffect(() => {
    if (productData) {
      setForm({
        name: productData.name || "",
        description: productData.description || "",
        price: productData.price || "",
        discountedPrice: productData.comparePrice || "",
        category: productData.category?._id || productData.category || "",
        brand: productData.brand?._id || productData.brand || "",
        gender: productData.gender || "unisex",
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
        lensType: productData.lensType || "",
        stock: productData.stock || "10",
        isFeatured: productData.isFeatured || false,
        isTrending: productData.isTrending || false,
        isNewArrival: productData.isNewArrival || false,
        isBestSeller: productData.isBestSeller || false,
        sku: productData.sku || "",
      });
      setExistingImages(productData.images || []);
    }
  }, [productData]);

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
      toast.success("Product updated!");
      navigate("/admin/products");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";
    if (!form.category) newErrors.category = "Please select a category";
    if (!form.price || Number(form.price) <= 0)
      newErrors.price = "Price must be greater than 0";

    if (form.discountedPrice) {
      const discountedPrice = Number(form.discountedPrice);
      const price = Number(form.price);
      if (discountedPrice <= 0) {
        newErrors.discountedPrice = "Discounted price must be greater than 0";
      } else if (discountedPrice >= price) {
        newErrors.discountedPrice =
          "Discounted price must be less than original price";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setUploading(true);
    let allImages = [...existingImages];

    if (imageFiles.length > 0) {
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("images", file));
      try {
        const { data } = await axios.post(
          `${API_URL}/upload/multiple`,
          formData,
        );
        const newImages = data.images.map((img, i) => ({
          url: img.url,
          alt: form.name,
          isMain: existingImages.length === 0 && i === 0,
        }));
        allImages = [...allImages, ...newImages];
      } catch (error) {
        toast.error("Image upload failed");
        setUploading(false);
        return;
      }
    }

    // Build specifications
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

    const productData = {
      ...form,
      price: Number(form.price),
      comparePrice: form.discountedPrice
        ? Number(form.discountedPrice)
        : undefined,
      stock: Number(form.stock),
      images: allImages,
      specifications: specifications.length > 0 ? specifications : undefined,
    };
    delete productData.discountedPrice;

    updateMutation.mutate(productData);
    setUploading(false);
  };

  const inputClass = (fieldName) =>
    `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition ${
      errors[fieldName]
        ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50"
        : "border-gray-200 focus:border-[#3D96EB] focus:ring-[#3D96EB]/20"
    }`;

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-light">Loading product...</p>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold text-text">Product Not Found</p>
        <button
          onClick={() => navigate("/admin/products")}
          className="btn-primary mt-4 text-sm"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text">Edit Product</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name *
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
              Description *
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
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
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
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
              Product Type *
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
              Original Price (₹) *
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
            </div>
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

          {/* Existing Images */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Product Images
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((img, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imagePreviews.map((preview, index) => (
                <div
                  key={`new-${index}`}
                  className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
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
            <div className="flex flex-wrap gap-4">
              {["isFeatured", "isTrending", "isNewArrival", "isBestSeller"].map(
                (key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      className="w-4 h-4 text-[#3D96EB] rounded"
                    />
                    <span className="text-sm capitalize">
                      {key
                        .replace("is", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </span>
                  </label>
                ),
              )}
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
