// backend/controllers/uploadController.js

import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select an image file.",
      });
    }

    // ✅ Verify it's actually an image before uploading to Cloudinary
    const filePath = req.file.path;
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Uploaded file is empty. Please try again.",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "spexxo/products",
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    });

    // Delete local file
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkError) {
      console.log("File already deleted or not found:", unlinkError.message);
    }

    res.status(200).json({
      success: true,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up file if exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    res.status(400).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};

export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded. Please select image files.",
      });
    }

    // ✅ Validate all files before uploading
    const validFiles = [];
    for (const file of req.files) {
      const stats = fs.statSync(file.path);
      if (stats.size > 0) {
        validFiles.push(file);
      } else {
        // Remove empty files
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    }

    if (validFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All uploaded files were empty. Please try again.",
      });
    }

    const uploadPromises = validFiles.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "spexxo/products",
        use_filename: true,
        unique_filename: true,
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
      }),
    );

    const results = await Promise.all(uploadPromises);

    // Delete local files
    validFiles.forEach((file) => {
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (e) {
        console.log("Failed to delete file:", e.message);
      }
    });

    const images = results.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));

    res.status(200).json({ success: true, images });
  } catch (error) {
    console.error("Multiple upload error:", error);
    // Clean up files
    if (req.files) {
      req.files.forEach((file) => {
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (e) {}
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
};
