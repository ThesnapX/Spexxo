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
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "spexxo/products",
      use_filename: true,
      unique_filename: true,
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
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const uploadPromises = req.files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "spexxo/products",
        use_filename: true,
        unique_filename: true,
      }),
    );

    const results = await Promise.all(uploadPromises);

    // Delete local files
    req.files.forEach((file) => {
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
