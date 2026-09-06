// frontend/src/main.jsx - Complete optimized version

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import "./index.css";

// ✅ Production-optimized QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchInterval: false,
      retryOnMount: true,
      keepPreviousData: true,
    },
  },
});

// ✅ Defer analytics loading for better performance
const loadAnalytics = () => {
  import("./utils/analytics")
    .then(({ initGA }) => {
      initGA();
    })
    .catch(() => {
      // Silently fail if analytics isn't set up yet
    });
};

// Load analytics after page is interactive
if (typeof window !== "undefined") {
  setTimeout(loadAnalytics, 3000);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <App />
                <Toaster
                  position="top-center"
                  gutter={8}
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#0B1C39",
                      color: "#fff",
                      borderRadius: "12px",
                      padding: "16px 44px 16px 20px",
                      fontSize: "14px",
                      maxWidth: "420px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                    },
                    success: {
                      style: {
                        background: "#0B1C39",
                        color: "#fff",
                        borderLeft: "4px solid #10b981",
                      },
                      icon: "✅",
                    },
                    error: {
                      style: {
                        background: "#0B1C39",
                        color: "#fff",
                        borderLeft: "4px solid #ef4444",
                      },
                      icon: "❌",
                    },
                    className: "custom-toast",
                  }}
                />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
