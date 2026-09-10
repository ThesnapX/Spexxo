// backend/models/Shipping.js

import mongoose from "mongoose";

const pincodeRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["single", "range"],
    required: true,
  },
  // ✅ Main Folder/Region (e.g., State)
  folder: {
    type: String,
    required: [true, "Folder/State name is required"],
    trim: true,
    index: true,
  },
  // ✅ NEW: Sub-folder (e.g., City/Zone)
  subFolder: {
    type: String,
    trim: true,
    index: true,
    default: null,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  // For single pincode
  pincode: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.type === "single") {
          return /^[0-9]{6}$/.test(v);
        }
        return true;
      },
      message: "Pincode must be 6 digits",
    },
  },
  // For range
  pincodeFrom: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.type === "range") {
          return /^[0-9]{6}$/.test(v);
        }
        return true;
      },
    },
  },
  pincodeTo: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.type === "range") {
          return /^[0-9]{6}$/.test(v);
        }
        return true;
      },
    },
  },
  shippingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  estimatedDelivery: {
    type: String,
    default: "3-7 business days",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Compound indexes for better performance
pincodeRuleSchema.index({ folder: 1, subFolder: 1 });
pincodeRuleSchema.index(
  { folder: 1, subFolder: 1, pincode: 1 },
  { sparse: true },
);
pincodeRuleSchema.index(
  { folder: 1, subFolder: 1, pincodeFrom: 1, pincodeTo: 1 },
  { sparse: true },
);

// Bulk Upload History Schema
const bulkUploadHistorySchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  filePublicId: {
    type: String,
    required: true,
  },
  totalRecords: {
    type: Number,
    default: 0,
  },
  successCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
  errors: [
    {
      row: Number,
      message: String,
      data: mongoose.Schema.Types.Mixed,
    },
  ],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const shippingSettingsSchema = new mongoose.Schema({
  ultraFastAdditional: {
    type: Number,
    default: 50,
    min: 0,
  },
  ultraFastDelivery: {
    type: String,
    default: "1-2 business days",
  },
  defaultShippingPrice: {
    type: Number,
    default: 99,
    min: 0,
  },
  defaultDelivery: {
    type: String,
    default: "3-7 business days",
  },
  extraPerQuantity: {
    type: Number,
    default: 20,
    min: 0,
  },
  quantityRules: {
    type: [],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

shippingSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const PincodeRule = mongoose.model("PincodeRule", pincodeRuleSchema);
const ShippingSettings = mongoose.model(
  "ShippingSettings",
  shippingSettingsSchema,
);
const BulkUploadHistory = mongoose.model(
  "BulkUploadHistory",
  bulkUploadHistorySchema,
);

export { PincodeRule, ShippingSettings, BulkUploadHistory };
