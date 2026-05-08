import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "spexxo",
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
      cloudinary.uploader.upload(file.path, { folder: "spexxo" }),
    );

    const results = await Promise.all(uploadPromises);

    // Delete local files
    req.files.forEach((file) => fs.unlinkSync(file.path));

    const images = results.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));

    res.status(200).json({ success: true, images });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
