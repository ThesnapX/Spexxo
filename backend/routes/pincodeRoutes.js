// backend/routes/pincodeRoutes.js

import express from "express";
import axios from "axios";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get address details from pincode
// @route   GET /api/pincode/:code
// @access  Public (or Private if you want to restrict)
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // Validate pincode format
    if (!code || !/^[0-9]{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format. Must be 6 digits.",
      });
    }

    // Try India Post API first
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${code}`,
        {
          timeout: 5000,
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = response.data;
      if (data && data[0]?.Status === "Success") {
        const postOffice = data[0].PostOffice;
        if (postOffice && postOffice.length > 0) {
          const firstOffice = postOffice[0];
          return res.json({
            success: true,
            data: {
              city: firstOffice.District || firstOffice.Division || "",
              state: firstOffice.State || "",
              country: firstOffice.Country || "India",
              area: firstOffice.Name || "",
              postOffice: firstOffice.Name || "",
            },
          });
        }
      }
    } catch (error) {
      console.log("India Post API failed, trying alternative...");
    }

    // Try Zippopotam API as fallback
    try {
      const response = await axios.get(`https://api.zippopotam.us/in/${code}`, {
        timeout: 5000,
        headers: {
          Accept: "application/json",
        },
      });

      const data = response.data;
      if (data && data.places && data.places.length > 0) {
        const place = data.places[0];
        return res.json({
          success: true,
          data: {
            city: place["place name"] || "",
            state: place["state"] || "",
            country: data.country || "India",
            area: place["place name"] || "",
            postOffice: place["place name"] || "",
          },
        });
      }
    } catch (error) {
      console.log("Zippopotam API failed");
    }

    // If both APIs fail, return error
    return res.status(404).json({
      success: false,
      message:
        "Could not fetch location details for this pincode. Please enter manually.",
    });
  } catch (error) {
    console.error("Pincode API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pincode details. Please enter manually.",
    });
  }
});

export default router;
