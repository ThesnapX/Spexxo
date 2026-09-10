// backend/middleware/csvUpload.js

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
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ✅ CSV file filter - accepts CSV files
const csvFilter = (req, file, cb) => {
  // Check file extension
  const extname = path.extname(file.originalname).toLowerCase();
  const isCsvExtension = extname === ".csv";

  // Check MIME type
  const isCsvMimeType =
    file.mimetype === "text/csv" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/csv";

  if (isCsvExtension || isCsvMimeType) {
    return cb(null, true);
  }

  const error = new Error(
    `File format not supported. Please upload a CSV file. Received: ${file.mimetype || file.originalname?.split(".").pop() || "unknown"}`,
  );
  error.code = "INVALID_FILE_TYPE";
  return cb(error);
};

export const csvUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for CSV files
  },
  fileFilter: csvFilter,
});

// ✅ Error handler for multer CSV upload errors
export const handleCsvMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one CSV file allowed.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field. Please use 'file' as the field name.",
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
      message: err.message || "Invalid file type. Only CSV files are allowed.",
    });
  }

  // If it's a different error, pass it to the next middleware
  next(err);
};
