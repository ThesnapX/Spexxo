// frontend/src/utils/pincodeService.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const fetchAddressByPincode = async (pincode) => {
  if (!pincode || pincode.length !== 6) {
    return null;
  }

  try {
    // Use our backend proxy to avoid CORS issues
    const response = await axios.get(`${API_URL}/pincode/${pincode}`, {
      timeout: 10000,
    });

    const data = response.data;
    if (data && data.success && data.data) {
      return {
        city: data.data.city || "",
        state: data.data.state || "",
        country: data.data.country || "India",
        area: data.data.area || "",
        postOffice: data.data.postOffice || "",
        success: true,
      };
    }
    return { success: false, message: data.message || "Invalid pincode" };
  } catch (error) {
    console.error("Pincode API error:", error);
    if (error.response) {
      return {
        success: false,
        message:
          error.response.data?.message || "Failed to fetch pincode details",
      };
    }
    return {
      success: false,
      message: "Network error. Please try again.",
    };
  }
};

// Main function to get address from pincode
export const getAddressFromPincode = async (pincode) => {
  return await fetchAddressByPincode(pincode);
};

// Validation functions
export const validateAddress = (addressData) => {
  const errors = {};

  if (!addressData.fullName || addressData.fullName.trim().length < 2) {
    errors.fullName = "Full name is required and must be at least 2 characters";
  }

  if (!addressData.phone || addressData.phone.length < 10) {
    errors.phone = "Valid phone number is required (10 digits)";
  } else if (!/^[0-9]{10}$/.test(addressData.phone)) {
    errors.phone = "Phone number must be 10 digits";
  }

  if (!addressData.addressLine1 || addressData.addressLine1.trim().length < 3) {
    errors.addressLine1 = "Address line 1 is required";
  }

  if (!addressData.city || addressData.city.trim().length < 2) {
    errors.city = "City is required";
  }

  if (!addressData.state || addressData.state.trim().length < 2) {
    errors.state = "State is required";
  }

  if (!addressData.pincode || addressData.pincode.length < 6) {
    errors.pincode = "Valid 6-digit pincode is required";
  } else if (!/^[0-9]{6}$/.test(addressData.pincode)) {
    errors.pincode = "Pincode must be 6 digits";
  }

  return errors;
};

export const formatAddressForDisplay = (address) => {
  if (!address) return "";
  const parts = [];
  if (address.fullName) parts.push(address.fullName);
  if (address.addressLine1) parts.push(address.addressLine1);
  if (address.addressLine2) parts.push(address.addressLine2);
  if (address.area) parts.push(address.area);
  if (address.landmark) parts.push(`Landmark: ${address.landmark}`);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);
  if (address.phone) parts.push(`Phone: ${address.phone}`);
  return parts.join(", ");
};
