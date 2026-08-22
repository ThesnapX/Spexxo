// frontend/src/components/admin/VariantForm.jsx

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import SearchableMultiSelect from "./SearchableMultiSelect";
import SearchableSingleSelect from "./SearchableSingleSelect";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const VariantForm = ({ variant, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    comparePrice: "",
    stock: "0",
    color: "",
    frameShape: "",
    frameMaterial: "",
    lensType: "",
    frameColor: "",
    frameWidth: "",
    lensWidth: "",
    frameHeight: "",
    bridge: "",
    images: [],
    isDefault: false,
    isActive: true,
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch data for dropdowns
  const { data: shapesData } = useQuery({
    queryKey: ["shapes"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/shapes`);
      return data.shapes || [];
    },
  });

  const { data: colorsData } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/colors`);
      return data.colors || [];
    },
  });

  const { data: lensTypesData } = useQuery({
    queryKey: ["lens-types"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/lens-types`);
      return data.lensTypes || [];
    },
  });

  const { data: frameMaterialsData } = useQuery({
    queryKey: ["frame-materials"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/frame-materials`);
      return data.frameMaterials || [];
    },
  });

  useEffect(() => {
    if (variant) {
      setFormData({
        name: variant.name || "",
        sku: variant.sku || "",
        price: variant.price || "",
        comparePrice: variant.comparePrice || "",
        stock: variant.stock || "0",
        color: variant.color?._id || variant.color || "",
        frameShape: variant.frameShape || "",
        frameMaterial: variant.frameMaterial || "",
        lensType: variant.lensType || "",
        frameColor: variant.frameColor || "",
        frameWidth: variant.frameWidth || "",
        lensWidth: variant.lensWidth || "",
        frameHeight: variant.frameHeight || "",
        bridge: variant.bridge || "",
        images: variant.images || [],
        isDefault: variant.isDefault || false,
        isActive: variant.isActive !== false,
      });
      if (variant.images) {
        setImagePreviews(variant.images.map((img) => img.url || img));
      }
    }
  }, [variant]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // FIXED: Upload images and save variant
  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Variant name and price are required");
      return;
    }

    setUploading(true);

    // Upload images if any
    let uploadedImages = [...formData.images];
    if (imageFiles.length > 0) {
      try {
        const fd = new FormData();
        imageFiles.forEach((file) => fd.append("images", file));
        const { data } = await axios.post(`${API_URL}/upload/multiple`, fd);
        const newImages = data.images.map((img) => ({
          url: img.url,
          alt: formData.name,
        }));
        uploadedImages = [...uploadedImages, ...newImages];
        toast.success(`${newImages.length} image(s) uploaded!`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Image upload failed");
        setUploading(false);
        return;
      }
    }

    const variantData = {
      ...formData,
      price: parseFloat(formData.price),
      comparePrice: formData.comparePrice
        ? parseFloat(formData.comparePrice)
        : undefined,
      stock: parseInt(formData.stock) || 0,
      images: uploadedImages,
      frameWidth: formData.frameWidth
        ? parseFloat(formData.frameWidth)
        : undefined,
      lensWidth: formData.lensWidth
        ? parseFloat(formData.lensWidth)
        : undefined,
      frameHeight: formData.frameHeight
        ? parseFloat(formData.frameHeight)
        : undefined,
      bridge: formData.bridge ? parseFloat(formData.bridge) : undefined,
      isDefault: formData.isDefault || false,
      isActive: formData.isActive !== false,
    };

    onSave(variantData);
    setUploading(false);
  };

  const renderColorOption = (color) => (
    <span className="flex items-center gap-2">
      <span
        className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
        style={{ backgroundColor: color.hexCode || "#000" }}
      />
      {color.name}
    </span>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Edit Variant" : "Add New Variant"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <form className="space-y-4">
        {/* Variant Name & SKU */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Variant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. Blue Metal"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="Variant SKU"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="₹"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Compare Price
            </label>
            <input
              type="number"
              value={formData.comparePrice}
              onChange={(e) => handleChange("comparePrice", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="₹"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <SearchableSingleSelect
              options={colorsData || []}
              value={formData.color}
              onChange={(val) => handleChange("color", val)}
              placeholder="Search colors..."
              renderOption={renderColorOption}
              getValue={(color) => color._id}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Shape
            </label>
            <SearchableMultiSelect
              options={shapesData || []}
              selectedValues={
                formData.frameShape
                  ? formData.frameShape.split(",").filter(Boolean)
                  : []
              }
              onChange={(values) =>
                handleChange("frameShape", values.join(","))
              }
              placeholder="Search shapes..."
              renderOption={(shape) => shape.name}
              getValue={(shape) => shape.name}
              maxHeight="max-h-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Material
            </label>
            <SearchableMultiSelect
              options={frameMaterialsData || []}
              selectedValues={
                formData.frameMaterial
                  ? formData.frameMaterial.split(",").filter(Boolean)
                  : []
              }
              onChange={(values) =>
                handleChange("frameMaterial", values.join(","))
              }
              placeholder="Search materials..."
              renderOption={(mat) => mat.name}
              getValue={(mat) => mat.name}
              maxHeight="max-h-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lens Type</label>
            <SearchableMultiSelect
              options={lensTypesData || []}
              selectedValues={
                formData.lensType
                  ? formData.lensType.split(",").filter(Boolean)
                  : []
              }
              onChange={(values) => handleChange("lensType", values.join(","))}
              placeholder="Search lens types..."
              renderOption={(lens) => lens.name}
              getValue={(lens) => lens.name}
              maxHeight="max-h-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Color
            </label>
            <SearchableMultiSelect
              options={colorsData || []}
              selectedValues={
                formData.frameColor
                  ? formData.frameColor.split(",").filter(Boolean)
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

        {/* Dimensions */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Width
            </label>
            <input
              type="number"
              value={formData.frameWidth}
              onChange={(e) => handleChange("frameWidth", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="mm"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lens Width</label>
            <input
              type="number"
              value={formData.lensWidth}
              onChange={(e) => handleChange("lensWidth", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="mm"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Frame Height
            </label>
            <input
              type="number"
              value={formData.frameHeight}
              onChange={(e) => handleChange("frameHeight", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="mm"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bridge</label>
            <input
              type="number"
              value={formData.bridge}
              onChange={(e) => handleChange("bridge", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="mm"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Variant Images
          </label>
          <div className="flex flex-wrap gap-3">
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
          <p className="text-xs text-text-light mt-2">
            Upload images for this variant. These will appear when this variant
            is selected.
          </p>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => handleChange("isDefault", e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm">Set as Default Variant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading}
            className="btn-primary text-sm"
          >
            {uploading
              ? "Uploading Images..."
              : isEditing
                ? "Update Variant"
                : "Add Variant"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default VariantForm;
