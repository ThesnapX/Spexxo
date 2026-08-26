// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster, toast } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Custom Toast Component with close button
const CustomToast = ({ toastId, icon, message }) => {
  const handleClose = () => {
    toast.dismiss(toastId);
  };

  return (
    <div className="custom-toast-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="toast-content-wrapper">
        {icon && <span className="toast-icon">{icon}</span>}
        <span className="toast-message">{message}</span>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={handleClose}
        aria-label="Close notification"
        tabIndex={0}
      >
        <span className="close-icon">×</span>
      </button>
    </div>
  );
};

// Helper function to create toast with close button
// This preserves all existing toast.success/error calls
const createToast = (message, options = {}) => {
  const toastId = toast.custom(
    (t) => <CustomToast toastId={t.id} icon={options.icon} message={message} />,
    {
      duration: options.duration || 5000,
      position: options.position || "top-center",
      ...options,
    },
  );
  return toastId;
};

// Override toast methods to use custom render
// This way existing toast.success/error calls work without changes
const originalToast = toast;

// Store original methods
const originalSuccess = toast.success;
const originalError = toast.error;
const originalLoading = toast.loading;
const originalCustom = toast.custom;

// Override success
toast.success = (message, options = {}) => {
  return createToast(message, {
    ...options,
    icon: options.icon || "✅",
    style: {
      ...options.style,
      borderLeft: "4px solid #10b981",
    },
  });
};

// Override error
toast.error = (message, options = {}) => {
  return createToast(message, {
    ...options,
    icon: options.icon || "❌",
    style: {
      ...options.style,
      borderLeft: "4px solid #ef4444",
    },
  });
};

// Override loading
toast.loading = (message, options = {}) => {
  return createToast(message, {
    ...options,
    icon: options.icon || "⏳",
    duration: 9999999, // Keep loading until dismissed
    style: {
      ...options.style,
      borderLeft: "4px solid #3D96EB",
    },
  });
};

// Keep original custom for advanced use cases
toast.custom = originalCustom;

// Keep original dismiss
toast.dismiss = originalToast.dismiss;
toast.remove = originalToast.remove;

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
                    duration: 5000,
                    className: "custom-toast-container",
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
