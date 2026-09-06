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
    chunkSizeWarningLimit: 1000,
    // ✅ Correct way to split chunks in Vite 8 with Rolldown
    rollupOptions: {
      output: {
        // ✅ manualChunks must be a function that returns a string or null
        manualChunks: function (id) {
          if (id.includes("node_modules")) {
            // Return a string for the chunk name
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("react-router")) {
              return "vendor-router";
            }
            if (id.includes("@heroicons") || id.includes("framer-motion")) {
              return "vendor-ui";
            }
            if (id.includes("@tanstack") || id.includes("axios")) {
              return "vendor-data";
            }
            if (id.includes("swiper")) {
              return "vendor-swiper";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            // Default vendor chunk
            return "vendor";
          }
          // Return null for app code to go to main chunk
          return null;
        },
      },
    },
  },
});
