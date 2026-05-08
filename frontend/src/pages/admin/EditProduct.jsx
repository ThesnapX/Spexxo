import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    comparePrice: "",
    category: "",
    brand: "",
    gender: "unisex",
    productType: "eyeglasses",
    frameShape: "",
    frameMaterial: "",
    frameColor: "",
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

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/${id}`);
      return data.product;
    },
  });

  useEffect(() => {
    if (productData) {
      setForm({
        name: productData.name || "",
        description: productData.description || "",
        shortDescription: productData.shortDescription || "",
        price: productData.price || "",
        comparePrice: productData.comparePrice || "",
        category: productData.category?._id || productData.category || "",
        brand: productData.brand?._id || productData.brand || "",
        gender: productData.gender || "unisex",
        productType: productData.productType || "eyeglasses",
        frameShape: productData.frameShape || "",
        frameMaterial: productData.frameMaterial || "",
        frameColor: productData.frameColor || "",
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

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const productData = {
      ...form,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock),
      images: allImages,
    };

    updateMutation.mutate(productData);
    setUploading(false);
  };

  if (productLoading)
    return <div className="p-8 text-center">Loading product...</div>;

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
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name *
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
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) =>
                setForm({ ...form, shortDescription: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              required
            >
              <option value="">Select</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
            >
              <option value="">Select</option>
              {brands?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Compare Price (₹)
            </label>
            <input
              type="number"
              value={form.comparePrice}
              onChange={(e) =>
                setForm({ ...form, comparePrice: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Shape
            </label>
            <select
              value={form.frameShape}
              onChange={(e) => setForm({ ...form, frameShape: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
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
          <div>
            <label className="block text-sm font-medium mb-1">Lens Type</label>
            <select
              value={form.lensType}
              onChange={(e) => setForm({ ...form, lensType: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
            >
              <option value="">Select</option>
              <option value="blue-cut">Blue Cut</option>
              <option value="photochromic">Photochromic</option>
              <option value="polarized">Polarized</option>
              <option value="single-vision">Single Vision</option>
              <option value="bifocal">Bifocal</option>
              <option value="progressive">Progressive</option>
            </select>
          </div>

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
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg"
                  >
                    <XMarkIcon className="w-3 h-3" />
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
                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg"
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
          </div>

          <div className="md:col-span-2 flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary text-sm"
            >
              {uploading ? "Uploading..." : "Update Product"}
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
