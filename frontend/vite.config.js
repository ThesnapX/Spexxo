// frontend/vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    // ✅ Enable chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@heroicons/react", "framer-motion"],
          data: ["@tanstack/react-query", "axios"],
          charts: ["recharts"],
        },
      },
    },
    // ✅ Reduce chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
});
