// backend/middleware/upload.js

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitize filename
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "");
    const ext = path.extname(cleanName) || path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ✅ Enhanced file filter with better error messages
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|svg|bmp|tiff)$/i;
  // Allowed MIME types
  const allowedMimeTypes =
    /^image\/(jpeg|jpg|png|gif|webp|svg\+xml|bmp|tiff)$/i;

  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  // ✅ Better error message with details
  const error = new Error(
    `File format not supported. Please upload one of these formats: JPEG, JPG, PNG, GIF, WEBP, SVG. Received: ${file.mimetype || file.originalname?.split(".").pop() || "unknown"}`,
  );
  error.code = "INVALID_FILE_TYPE";
  return cb(error);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Max 10 files at once
  },
  fileFilter: fileFilter,
});

// ✅ Error handler for multer-specific errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum 10 files allowed.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Upload error",
    });
  }

  if (err && err.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid file type. Only images are allowed.",
    });
  }

  next(err);
};
