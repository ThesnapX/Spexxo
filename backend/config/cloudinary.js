// backend/config/cloudinary.js

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Log configuration (without exposing secrets)
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not Set",
  api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not Set",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not Set",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
