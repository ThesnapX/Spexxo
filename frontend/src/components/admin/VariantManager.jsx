// frontend/src/components/admin/VariantManager.jsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import SearchableSingleSelect from "./SearchableSingleSelect";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const VariantManager = ({ variants = [], onVariantsChange, productType }) => {
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [variantForm, setVariantForm] = useState({
    name: "",
    sku: "",
    price: "",
    comparePrice: "",
    stock: "0",
    color: "",
    images: [],
    isActive: true,
  });

  // Fetch colors for color swatches
  const { data: colorsData } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/colors`);
      return data.colors || [];
    },
  });

  const colors = colorsData || [];

  // Find which variant is currently default (first one by convention, or one with isDefault flag)
  const getDefaultVariantIndex = () => {
    const defaultIndex = variants.findIndex((v) => v.isDefault === true);
    return defaultIndex !== -1 ? defaultIndex : 0;
  };

  const defaultVariantIndex = getDefaultVariantIndex();

  const handleSetDefaultVariant = (index) => {
    const updatedVariants = variants.map((v, i) => ({
      ...v,
      isDefault: i === index,
    }));
    onVariantsChange(updatedVariants);
    toast.success(`"${variants[index].name}" set as default variant`);
  };

  const handleAddVariant = () => {
    if (!variantForm.name || !variantForm.price) {
      toast.error("Variant name and price are required");
      return;
    }

    const newVariant = {
      name: variantForm.name,
      sku: variantForm.sku || undefined,
      price: parseFloat(variantForm.price),
      comparePrice: variantForm.comparePrice
        ? parseFloat(variantForm.comparePrice)
        : undefined,
      stock: parseInt(variantForm.stock) || 0,
      color: variantForm.color || null,
      images: variantForm.images.map((img) => ({
        url: img,
        alt: variantForm.name,
      })),
      isActive: variantForm.isActive !== false,
      isDefault: variants.length === 0, // First variant becomes default
    };

    if (editingVariantIndex !== null) {
      const updatedVariants = [...variants];
      updatedVariants[editingVariantIndex] = newVariant;
      onVariantsChange(updatedVariants);
      toast.success("Variant updated!");
    } else {
      onVariantsChange([...variants, newVariant]);
      toast.success("Variant added!");
    }

    resetVariantForm();
  };

  const resetVariantForm = () => {
    setVariantForm({
      name: "",
      sku: "",
      price: "",
      comparePrice: "",
      stock: "0",
      color: "",
      images: [],
      isActive: true,
    });
    setEditingVariantIndex(null);
    setShowVariantForm(false);
  };

  const handleEditVariant = (index) => {
    const variant = variants[index];
    setVariantForm({
      name: variant.name || "",
      sku: variant.sku || "",
      price: variant.price || "",
      comparePrice: variant.comparePrice || "",
      stock: variant.stock || "0",
      color: variant.color?._id || variant.color || "",
      images: variant.images?.map((img) => img.url || img) || [],
      isActive: variant.isActive !== false,
    });
    setEditingVariantIndex(index);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = (index) => {
    if (window.confirm("Are you sure you want to remove this variant?")) {
      const updatedVariants = variants.filter((_, i) => i !== index);
      // If we deleted the default variant, set the first one as default
      if (index === defaultVariantIndex && updatedVariants.length > 0) {
        updatedVariants[0].isDefault = true;
      }
      onVariantsChange(updatedVariants);
      toast.success("Variant removed");
    }
  };

  const handleVariantImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setVariantForm({
      ...variantForm,
      images: [...variantForm.images, ...imageUrls],
    });
  };

  const removeVariantImage = (index) => {
    setVariantForm({
      ...variantForm,
      images: variantForm.images.filter((_, i) => i !== index),
    });
  };

  // Get color object by ID
  const getColorById = (id) => {
    return colors.find((c) => c._id === id) || null;
  };

  // Render option for color with swatch
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">Product Variants</h3>
        <button
          type="button"
          onClick={() => setShowVariantForm(!showVariantForm)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" />
          {variants.length > 0 ? "Add Another Variant" : "Add Variant"}
        </button>
      </div>

      {/* Variant Form */}
      {showVariantForm && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-text">
              {editingVariantIndex !== null ? "Edit Variant" : "New Variant"}
            </h4>
            <button type="button" onClick={resetVariantForm}>
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Variant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. Black Gold"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={variantForm.sku}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, sku: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Variant SKU"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={variantForm.price}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
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
                value={variantForm.comparePrice}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    comparePrice: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
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
                value={variantForm.stock}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, stock: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          {/* Color Selection with SearchableSingleSelect */}
          <div className="mt-3">
            <SearchableSingleSelect
              label="Color (Optional)"
              options={colors}
              value={variantForm.color}
              onChange={(val) => setVariantForm({ ...variantForm, color: val })}
              placeholder="Search colors..."
              renderOption={renderColorOption}
              getValue={(color) => color._id}
            />
          </div>

          {/* Variant Images */}
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2">
              Variant Images
            </label>
            <div className="flex flex-wrap gap-2">
              {variantForm.images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariantImage(i)}
                    className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary">
                <PhotoIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Add</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleVariantImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleAddVariant}
              className="btn-primary text-sm"
            >
              {editingVariantIndex !== null ? "Update Variant" : "Add Variant"}
            </button>
            <button
              type="button"
              onClick={resetVariantForm}
              className="btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Variants List with Default Selector */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {/* ✅ Default Variant Dropdown */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="text-sm font-medium text-text block mb-2">
              Default Variant (for product card display)
            </label>
            <select
              value={defaultVariantIndex}
              onChange={(e) =>
                handleSetDefaultVariant(parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
            >
              {variants.map((variant, index) => (
                <option key={index} value={index}>
                  {variant.name} {variant.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-light mt-1">
              The default variant's images and price will appear on product
              cards
            </p>
          </div>

          {variants.map((variant, index) => {
            const color =
              variant.color && typeof variant.color === "object"
                ? variant.color
                : getColorById(variant.color);
            const isDefault =
              variant.isDefault === true || index === defaultVariantIndex;

            return (
              <div
                key={index}
                className={`flex items-center justify-between bg-white p-3 rounded-lg border ${
                  isDefault ? "border-primary border-2" : "border-gray-100"
                } hover:shadow-sm transition`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Default Badge */}
                  {isDefault && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      DEFAULT
                    </span>
                  )}
                  {/* Color swatch */}
                  {color && color.hexCode && (
                    <span
                      className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hexCode || "#000" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text">
                      {variant.name}
                    </p>
                    <p className="text-xs text-text-light">
                      SKU: {variant.sku || "N/A"} • Stock: {variant.stock || 0}{" "}
                      • ₹{variant.price}
                      {variant.comparePrice && (
                        <span className="text-gray-400 line-through ml-2">
                          ₹{variant.comparePrice}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditVariant(index)}
                    className="p-1.5 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VariantManager;
