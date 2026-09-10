// backend/controllers/shippingController.js

import {
  PincodeRule,
  ShippingSettings,
  BulkUploadHistory,
} from "../models/Shipping.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import csv from "csv-parser";
import { parse } from "fast-csv";
// backend/controllers/shippingController.js

// @desc    Get all pincode rules with search
// @route   GET /api/shipping/pincodes
// @access  Private/Admin
export const getPincodeRules = async (req, res) => {
  try {
    const { folder, subFolder, search } = req.query;
    const query = {};

    if (folder) {
      query.folder = folder;
    }
    if (subFolder) {
      query.subFolder = subFolder;
    }

    // ✅ ADD SEARCH FUNCTIONALITY
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const isNumeric = /^[0-9]+$/.test(searchTerm);

      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { folder: { $regex: searchTerm, $options: "i" } },
        { subFolder: { $regex: searchTerm, $options: "i" } },
      ];

      // If searching by pincode (numeric)
      if (isNumeric) {
        // Search for exact pincode match
        query.$or.push({ pincode: searchTerm });

        // Search for pincode within any range
        const numericSearch = parseInt(searchTerm);
        query.$or.push({
          type: "range",
          pincodeFrom: { $lte: searchTerm },
          pincodeTo: { $gte: searchTerm },
        });
      }
    }

    const rules = await PincodeRule.find(query).sort("folder subFolder name");
    res.status(200).json({ success: true, rules });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all folders with sub-folders and counts
// @route   GET /api/shipping/folders
// @access  Private/Admin
export const getFolders = async (req, res) => {
  try {
    // ✅ Get all folders with sub-folder counts
    const folders = await PincodeRule.aggregate([
      {
        $group: {
          _id: {
            folder: "$folder",
            subFolder: { $ifNull: ["$subFolder", null] },
          },
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
      {
        $group: {
          _id: "$_id.folder",
          subFolders: {
            $push: {
              name: "$_id.subFolder",
              count: "$count",
              activeCount: "$activeCount",
            },
          },
          totalCount: { $sum: "$count" },
          totalActive: { $sum: "$activeCount" },
        },
      },
      {
        $project: {
          folder: "$_id",
          totalCount: 1,
          totalActive: 1,
          subFolders: {
            $filter: {
              input: "$subFolders",
              as: "sf",
              cond: { $ne: ["$$sf.name", null] },
            },
          },
          _id: 0,
        },
      },
      { $sort: { folder: 1 } },
    ]);

    res.status(200).json({ success: true, folders });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create pincode rule
// @route   POST /api/shipping/pincodes
// @access  Private/Admin
export const createPincodeRule = async (req, res) => {
  try {
    // ✅ Validate folder is provided
    if (!req.body.folder || !req.body.folder.trim()) {
      return res.status(400).json({
        success: false,
        message: "Folder/State name is required",
      });
    }
    // ✅ subFolder is optional - can be null or empty
    if (req.body.subFolder === "") {
      req.body.subFolder = null;
    }
    const rule = await PincodeRule.create(req.body);
    res.status(201).json({ success: true, rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update pincode rule
// @route   PUT /api/shipping/pincodes/:id
// @access  Private/Admin
export const updatePincodeRule = async (req, res) => {
  try {
    if (req.body.subFolder === "") {
      req.body.subFolder = null;
    }
    const rule = await PincodeRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) {
      return res
        .status(404)
        .json({ success: false, message: "Rule not found" });
    }
    res.status(200).json({ success: true, rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete pincode rule
// @route   DELETE /api/shipping/pincodes/:id
// @access  Private/Admin
export const deletePincodeRule = async (req, res) => {
  try {
    const rule = await PincodeRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res
        .status(404)
        .json({ success: false, message: "Rule not found" });
    }
    res.status(200).json({ success: true, message: "Rule deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete all pincode rules in a folder
// @route   DELETE /api/shipping/folders/:folder
// @access  Private/Admin
export const deleteFolder = async (req, res) => {
  try {
    const { folder } = req.params;
    const result = await PincodeRule.deleteMany({ folder });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Folder not found or empty" });
    }
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} rules from folder "${folder}"`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete all pincode rules in a sub-folder
// @route   DELETE /api/shipping/subfolders/:folder/:subFolder
// @access  Private/Admin
export const deleteSubFolder = async (req, res) => {
  try {
    const { folder, subFolder } = req.params;
    const result = await PincodeRule.deleteMany({ folder, subFolder });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-folder not found or empty" });
    }
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} rules from "${folder}/${subFolder}"`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete all pincode rules
// @route   DELETE /api/shipping/pincodes
// @access  Private/Admin
export const deleteAllPincodeRules = async (req, res) => {
  try {
    await PincodeRule.deleteMany({});
    res.status(200).json({ success: true, message: "All rules deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============ BULK UPLOAD CONTROLLERS ============

// @desc    Upload bulk pincode rules via CSV
// @route   POST /api/shipping/bulk-upload
// @access  Private/Admin
export const bulkUploadPincodes = async (req, res) => {
  try {
    // ✅ Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a CSV file.",
      });
    }

    // ✅ Log the uploaded file info for debugging
    console.log("Uploaded file:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const results = [];
    const errors = [];
    let rowNumber = 0;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
          rowNumber++;
          // Skip empty rows
          if (
            !data.folder &&
            !data.name &&
            !data.pincode &&
            !data.pincodeFrom
          ) {
            return;
          }
          results.push({ ...data, rowNumber });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // ✅ Check if CSV has any data
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "The CSV file is empty or has no valid data. Please check the file format.",
      });
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each row
    for (const row of results) {
      try {
        const {
          folder,
          subFolder,
          name,
          type,
          pincode,
          pincodeFrom,
          pincodeTo,
          shippingPrice,
          estimatedDelivery,
          isActive,
        } = row;

        // Validate folder is provided
        if (!folder || !folder.trim()) {
          errors.push({
            row: row.rowNumber,
            message: "Folder/State name is required",
            data: row,
          });
          failedCount++;
          continue;
        }

        // Validate required fields
        if (!name || !name.trim()) {
          errors.push({
            row: row.rowNumber,
            message: "Name is required",
            data: row,
          });
          failedCount++;
          continue;
        }

        if (!shippingPrice || isNaN(parseFloat(shippingPrice))) {
          errors.push({
            row: row.rowNumber,
            message: "Valid Shipping Price is required",
            data: row,
          });
          failedCount++;
          continue;
        }

        // Determine type
        const ruleType = type?.toLowerCase() === "range" ? "range" : "single";

        // Build data object
        const ruleData = {
          folder: folder.trim(),
          subFolder: subFolder && subFolder.trim() ? subFolder.trim() : null,
          name: name.trim(),
          type: ruleType,
          shippingPrice: parseFloat(shippingPrice) || 0,
          estimatedDelivery: estimatedDelivery || "3-7 business days",
          isActive:
            isActive?.toLowerCase() === "true" ||
            isActive?.toLowerCase() === "yes" ||
            isActive === "1"
              ? true
              : false,
        };

        if (ruleType === "single") {
          if (!pincode || !/^[0-9]{6}$/.test(pincode)) {
            errors.push({
              row: row.rowNumber,
              message: "Invalid pincode format (must be 6 digits)",
              data: row,
            });
            failedCount++;
            continue;
          }
          ruleData.pincode = pincode;
        } else {
          if (
            !pincodeFrom ||
            !pincodeTo ||
            !/^[0-9]{6}$/.test(pincodeFrom) ||
            !/^[0-9]{6}$/.test(pincodeTo)
          ) {
            errors.push({
              row: row.rowNumber,
              message: "Invalid pincode range (must be 6 digits)",
              data: row,
            });
            failedCount++;
            continue;
          }
          if (parseInt(pincodeFrom) > parseInt(pincodeTo)) {
            errors.push({
              row: row.rowNumber,
              message: "From pincode must be less than To pincode",
              data: row,
            });
            failedCount++;
            continue;
          }
          ruleData.pincodeFrom = pincodeFrom;
          ruleData.pincodeTo = pincodeTo;
        }

        // Check for duplicate in same folder and sub-folder
        let existingRule = null;
        if (ruleType === "single") {
          existingRule = await PincodeRule.findOne({
            folder: ruleData.folder,
            subFolder: ruleData.subFolder,
            type: "single",
            pincode: ruleData.pincode,
          });
        } else {
          existingRule = await PincodeRule.findOne({
            folder: ruleData.folder,
            subFolder: ruleData.subFolder,
            type: "range",
            pincodeFrom: ruleData.pincodeFrom,
            pincodeTo: ruleData.pincodeTo,
          });
        }

        if (existingRule) {
          // Update existing rule
          await PincodeRule.findByIdAndUpdate(existingRule._id, ruleData, {
            new: true,
            runValidators: true,
          });
        } else {
          // Create new rule
          await PincodeRule.create(ruleData);
        }
        successCount++;
      } catch (error) {
        console.error("Error processing row:", error);
        errors.push({
          row: row.rowNumber,
          message: error.message || "Failed to process row",
          data: row,
        });
        failedCount++;
      }
    }

    // Upload file to Cloudinary for storage
    let cloudinaryResult = null;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64File = fileBuffer.toString("base64");

      cloudinaryResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${base64File}`,
        {
          folder: "spexxo/shipping-uploads",
          resource_type: "raw",
          public_id: `shipping-bulk-upload-${Date.now()}`,
        },
      );
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed:", cloudinaryError);
    }

    // Save to history
    const history = await BulkUploadHistory.create({
      fileName: req.file.originalname,
      fileUrl: cloudinaryResult?.secure_url || "",
      filePublicId: cloudinaryResult?.public_id || "",
      totalRecords: results.length,
      successCount: successCount,
      failedCount: failedCount,
      errors: errors,
      uploadedBy: req.user._id,
    });

    // Delete local file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (unlinkError) {
      console.log("Failed to delete file:", unlinkError.message);
    }

    res.status(200).json({
      success: true,
      message: `Upload complete! ${successCount} records processed, ${failedCount} failed.`,
      totalRecords: results.length,
      successCount,
      failedCount,
      errors: errors,
      historyId: history._id,
      fileUrl: cloudinaryResult?.secure_url || null,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    // Clean up file
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (e) {}
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process bulk upload",
    });
  }
};

// @desc    Get upload history
// @route   GET /api/shipping/bulk-upload/history
// @access  Private/Admin
export const getUploadHistory = async (req, res) => {
  try {
    const history = await BulkUploadHistory.find()
      .populate("uploadedBy", "firstName lastName email")
      .sort("-createdAt")
      .limit(50);
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete upload history entry (and optionally cloudinary file)
// @route   DELETE /api/shipping/bulk-upload/history/:id
// @access  Private/Admin
export const deleteUploadHistory = async (req, res) => {
  try {
    const history = await BulkUploadHistory.findById(req.params.id);
    if (!history) {
      return res
        .status(404)
        .json({ success: false, message: "History not found" });
    }

    // Delete from Cloudinary if file exists
    if (history.filePublicId) {
      try {
        await cloudinary.uploader.destroy(history.filePublicId, {
          resource_type: "raw",
        });
        console.log("Deleted file from Cloudinary:", history.filePublicId);
      } catch (cloudinaryError) {
        console.log(
          "Failed to delete from Cloudinary:",
          cloudinaryError.message,
        );
      }
    }

    await BulkUploadHistory.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "History entry deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Generate CSV template for download
// @route   GET /api/shipping/template
// @access  Private/Admin
export const downloadTemplate = async (req, res) => {
  try {
    const { format } = req.query;

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=shipping-pincode-template.csv",
      );

      const headers = [
        "folder",
        "subFolder",
        "name",
        "type",
        "pincode",
        "pincodeFrom",
        "pincodeTo",
        "shippingPrice",
        "estimatedDelivery",
        "isActive",
      ];

      const sampleRows = [
        {
          folder: "Maharashtra",
          subFolder: "Mumbai Region",
          name: "Mumbai Central",
          type: "single",
          pincode: "400076",
          pincodeFrom: "",
          pincodeTo: "",
          shippingPrice: "50",
          estimatedDelivery: "3-5 business days",
          isActive: "true",
        },
        {
          folder: "Maharashtra",
          subFolder: "Pune Region",
          name: "Pune Range",
          type: "range",
          pincode: "",
          pincodeFrom: "411000",
          pincodeTo: "411099",
          shippingPrice: "70",
          estimatedDelivery: "3-7 business days",
          isActive: "true",
        },
        {
          folder: "Delhi NCR",
          subFolder: "Delhi Metro",
          name: "Delhi Central",
          type: "single",
          pincode: "110001",
          pincodeFrom: "",
          pincodeTo: "",
          shippingPrice: "60",
          estimatedDelivery: "2-4 business days",
          isActive: "true",
        },
        {
          folder: "Karnataka",
          subFolder: "Bangalore Region",
          name: "Bangalore CBD",
          type: "single",
          pincode: "560001",
          pincodeFrom: "",
          pincodeTo: "",
          shippingPrice: "55",
          estimatedDelivery: "3-5 business days",
          isActive: "true",
        },
        {
          folder: "Maharashtra",
          subFolder: "Mumbai Region",
          name: "Andheri",
          type: "single",
          pincode: "400093",
          pincodeFrom: "",
          pincodeTo: "",
          shippingPrice: "50",
          estimatedDelivery: "3-5 business days",
          isActive: "true",
        },
        {
          folder: "Maharashtra",
          subFolder: "Mumbai Region",
          name: "Navi Mumbai",
          type: "single",
          pincode: "400706",
          pincodeFrom: "",
          pincodeTo: "",
          shippingPrice: "55",
          estimatedDelivery: "3-5 business days",
          isActive: "true",
        },
      ];

      const csvStream = parse({ headers: true, writeHeaders: true });

      csvStream.pipe(res);

      // Write headers
      const headerRow = headers.join(",");
      res.write(headerRow + "\n");

      // Write sample rows
      for (const row of sampleRows) {
        const values = headers.map((h) => {
          const val = row[h] || "";
          return val;
        });
        res.write(values.join(",") + "\n");
      }

      res.end();
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid format. Use ?format=csv" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============ SETTINGS CONTROLLERS ============

// @desc    Get shipping settings
// @route   GET /api/shipping/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
  try {
    let settings = await ShippingSettings.findOne();
    if (!settings) {
      settings = await ShippingSettings.create({
        ultraFastAdditional: 50,
        ultraFastDelivery: "1-2 business days",
        defaultShippingPrice: 99,
        defaultDelivery: "3-7 business days",
        extraPerQuantity: 20,
        quantityRules: [],
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update shipping settings
// @route   PUT /api/shipping/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    const {
      ultraFastAdditional,
      ultraFastDelivery,
      defaultShippingPrice,
      defaultDelivery,
      extraPerQuantity,
    } = req.body;

    let settings = await ShippingSettings.findOne();
    if (!settings) {
      settings = await ShippingSettings.create({
        ultraFastAdditional: ultraFastAdditional || 50,
        ultraFastDelivery: ultraFastDelivery || "1-2 business days",
        defaultShippingPrice: defaultShippingPrice || 99,
        defaultDelivery: defaultDelivery || "3-7 business days",
        extraPerQuantity: extraPerQuantity || 20,
        quantityRules: [],
        updatedBy: req.user._id,
      });
    } else {
      settings.ultraFastAdditional =
        ultraFastAdditional !== undefined
          ? ultraFastAdditional
          : settings.ultraFastAdditional;
      settings.ultraFastDelivery =
        ultraFastDelivery || settings.ultraFastDelivery;
      settings.defaultShippingPrice =
        defaultShippingPrice !== undefined
          ? defaultShippingPrice
          : settings.defaultShippingPrice;
      settings.defaultDelivery = defaultDelivery || settings.defaultDelivery;
      settings.extraPerQuantity =
        extraPerQuantity !== undefined
          ? extraPerQuantity
          : settings.extraPerQuantity;
      settings.updatedBy = req.user._id;
      settings.updatedAt = new Date();
      await settings.save();
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============ PUBLIC CALCULATION ============

// @desc    Check pincode availability and calculate shipping
// @route   POST /api/shipping/calculate
// @access  Public
export const calculateShipping = async (req, res) => {
  try {
    const { pincode, items } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format",
      });
    }

    const totalQuantity =
      items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;

    let settings = await ShippingSettings.findOne();
    if (!settings) {
      settings = await ShippingSettings.create({
        ultraFastAdditional: 50,
        ultraFastDelivery: "1-2 business days",
        defaultShippingPrice: 99,
        defaultDelivery: "3-7 business days",
        extraPerQuantity: 20,
        quantityRules: [],
      });
    }

    let matchedRule = null;
    const rules = await PincodeRule.find({ isActive: true });

    for (const rule of rules) {
      if (rule.type === "single" && rule.pincode === pincode) {
        matchedRule = rule;
        break;
      }
      if (rule.type === "range") {
        const from = parseInt(rule.pincodeFrom);
        const to = parseInt(rule.pincodeTo);
        const pin = parseInt(pincode);
        if (pin >= from && pin <= to) {
          matchedRule = rule;
          break;
        }
      }
    }

    let basePrice = 0;
    let deliveryText = settings.defaultDelivery;

    if (matchedRule) {
      basePrice = matchedRule.shippingPrice;
      deliveryText = matchedRule.estimatedDelivery || settings.defaultDelivery;
    } else {
      basePrice = settings.defaultShippingPrice || 99;
    }

    const extraPerQuantity = settings.extraPerQuantity || 20;
    const extraItems = Math.max(0, totalQuantity - 1);
    const extraCost = extraItems * extraPerQuantity;
    const totalBasePrice = basePrice + extraCost;

    const ultraFastPrice =
      totalBasePrice + (settings.ultraFastAdditional || 50);

    res.status(200).json({
      success: true,
      pincode: pincode,
      isServiceable: true,
      basePrice: totalBasePrice,
      ultraFastPrice: ultraFastPrice,
      deliveryText: deliveryText,
      ultraFastDelivery: settings.ultraFastDelivery || "1-2 business days",
      totalQuantity: totalQuantity,
      extraPerQuantity: extraPerQuantity,
      extraItems: extraItems,
      matchedRule: matchedRule
        ? {
            name: matchedRule.name,
            folder: matchedRule.folder,
            subFolder: matchedRule.subFolder,
            type: matchedRule.type,
            value:
              matchedRule.type === "single"
                ? matchedRule.pincode
                : `${matchedRule.pincodeFrom} - ${matchedRule.pincodeTo}`,
          }
        : null,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get shipping options for checkout
// @route   POST /api/shipping/options
// @access  Private
export const getShippingOptions = async (req, res) => {
  try {
    const { pincode, items } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format",
      });
    }

    const totalQuantity =
      items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;

    let settings = await ShippingSettings.findOne();
    if (!settings) {
      settings = await ShippingSettings.create({
        ultraFastAdditional: 50,
        ultraFastDelivery: "1-2 business days",
        defaultShippingPrice: 99,
        defaultDelivery: "3-7 business days",
        extraPerQuantity: 20,
        quantityRules: [],
      });
    }

    let matchedRule = null;
    const rules = await PincodeRule.find({ isActive: true });

    for (const rule of rules) {
      if (rule.type === "single" && rule.pincode === pincode) {
        matchedRule = rule;
        break;
      }
      if (rule.type === "range") {
        const from = parseInt(rule.pincodeFrom);
        const to = parseInt(rule.pincodeTo);
        const pin = parseInt(pincode);
        if (pin >= from && pin <= to) {
          matchedRule = rule;
          break;
        }
      }
    }

    let basePrice = 0;
    let deliveryText = settings.defaultDelivery;

    if (matchedRule) {
      basePrice = matchedRule.shippingPrice;
      deliveryText = matchedRule.estimatedDelivery || settings.defaultDelivery;
    } else {
      basePrice = settings.defaultShippingPrice || 99;
    }

    const extraPerQuantity = settings.extraPerQuantity || 20;
    const extraItems = Math.max(0, totalQuantity - 1);
    const extraCost = extraItems * extraPerQuantity;
    const totalBasePrice = basePrice + extraCost;

    const ultraFastPrice =
      totalBasePrice + (settings.ultraFastAdditional || 50);

    const options = [
      {
        id: "basic",
        name: "Basic Shipping",
        price: totalBasePrice,
        delivery: deliveryText,
      },
      {
        id: "ultra-fast",
        name: "Ultra Fast Shipping",
        price: ultraFastPrice,
        delivery: settings.ultraFastDelivery || "1-2 business days",
      },
    ];

    res.status(200).json({
      success: true,
      isServiceable: true,
      options,
      pincode,
      extraPerQuantity: extraPerQuantity,
      extraItems: extraItems,
      totalQuantity: totalQuantity,
      matchedRule: matchedRule
        ? {
            name: matchedRule.name,
            folder: matchedRule.folder,
            subFolder: matchedRule.subFolder,
            type: matchedRule.type,
            value:
              matchedRule.type === "single"
                ? matchedRule.pincode
                : `${matchedRule.pincodeFrom} - ${matchedRule.pincodeTo}`,
          }
        : null,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
