// frontend/src/api/axios.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ─────────────────────────────────────────────
// Attach bearer token if present.
// ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────
// Response interceptor.
//
// Rules:
//   - 401 → if a token existed and we aren't already on /login, clear
//     the token and redirect ONCE. Otherwise, do nothing.
//   - Any other status → let the caller handle it.
// ─────────────────────────────────────────────
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hadToken = !!localStorage.getItem("token");

    if (status === 401 && hadToken) {
      // Clear the invalid token.
      localStorage.removeItem("token");

      // Guard against redirect loops.
      const path = window.location.pathname;
      const isAuthPage =
        PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
        path.startsWith("/reset-password");

      if (!isAuthPage) {
        // Preserve the intended destination so login can return the user.
        const redirect = encodeURIComponent(path + window.location.search);
        window.location.href = `/login?redirect=${redirect}`;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
