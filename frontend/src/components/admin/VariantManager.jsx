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

  const handleAddVariant = () => {
    if (!variantForm.name || !variantForm.price) {
      toast.error("Variant name and price are required");
      return;
    }

    // ✅ FIX: Only store the color ID, and ensure images are stored as objects
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

      {/* Existing Variants List */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, index) => {
            const color =
              variant.color && typeof variant.color === "object"
                ? variant.color
                : getColorById(variant.color);
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  {/* Color swatch */}
                  {color && color.hexCode && (
                    <span
                      className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hexCode || "#000" }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{variant.name}</p>
                    <p className="text-xs text-text-light">
                      SKU: {variant.sku || "N/A"} • Stock: {variant.stock || 0}{" "}
                      • ₹{variant.price}
                      {variant.comparePrice && (
                        <span className="text-gray-400 line-through ml-2">
                          ₹{variant.comparePrice}
                        </span>
                      )}
                    </p>
                    {color && color.name && (
                      <p className="text-xs text-text-light">
                        Color: {color.name}
                        {color.hexCode && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full ml-1 align-middle border"
                            style={{ backgroundColor: color.hexCode }}
                          />
                        )}
                      </p>
                    )}
                    {variant.images && variant.images.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {variant.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img.url || img}
                            alt=""
                            className="w-5 h-5 rounded object-cover border"
                          />
                        ))}
                        {variant.images.length > 3 && (
                          <span className="text-xs text-text-light">
                            +{variant.images.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
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
