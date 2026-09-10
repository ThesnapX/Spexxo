// frontend/src/api/shipping.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ ADMIN API ============

// Zones
export const getZones = () => api.get("/shipping/zones");
export const getZone = (id) => api.get(`/shipping/zones/${id}`);
export const createZone = (data) => api.post("/shipping/zones", data);
export const updateZone = (id, data) => api.put(`/shipping/zones/${id}`, data);
export const deleteZone = (id) => api.delete(`/shipping/zones/${id}`);

// Settings
export const getShippingSettings = () => api.get("/shipping/settings");
export const updateShippingSettings = (data) =>
  api.put("/shipping/settings", data);

// ============ PUBLIC API ============

// Calculate shipping
export const calculateShipping = (data) =>
  api.post("/shipping/calculate", data);
export const getShippingOptions = (data) => api.post("/shipping/options", data);
