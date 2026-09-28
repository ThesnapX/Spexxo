// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { captureFbclid } from "./utils/metaPixel.js";
import { shouldRetryQuery, retryDelay } from "./utils/queryRetry.js";
import {
  checkVersionAndReload,
  installChunkErrorHandler,
} from "./utils/versionCheck.js";
import "./index.css";

// ---- Install chunk-error handler BEFORE any dynamic import runs. ----
installChunkErrorHandler();

// On successful boot (no error thrown from import of App), clear the
// one-shot chunk-recovery marker so future deploys can trigger again.
try {
  sessionStorage.removeItem("spexxo_chunk_reload_attempted");
} catch {}

// Background version check — never blocks render.
checkVersionAndReload().catch(() => {});

try {
  if (typeof captureFbclid === "function") {
    captureFbclid();
  }
} catch (err) {
  console.warn("[Meta] captureFbclid failed:", err?.message);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: shouldRetryQuery,
      retryDelay,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchInterval: false,
      retryOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
                <Toaster
                  position="top-center"
                  gutter={8}
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#0B1C39",
                      color: "#fff",
                      borderRadius: "12px",
                      padding: "14px 44px 14px 18px",
                      fontSize: "14px",
                      maxWidth: "420px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                      position: "relative",
                    },
                    success: {
                      style: {
                        background: "#0B1C39",
                        color: "#fff",
                        borderLeft: "4px solid #10b981",
                      },
                      iconTheme: { primary: "#10b981", secondary: "#fff" },
                    },
                    error: {
                      style: {
                        background: "#0B1C39",
                        color: "#fff",
                        borderLeft: "4px solid #ef4444",
                      },
                      iconTheme: { primary: "#ef4444", secondary: "#fff" },
                    },
                    loading: {
                      style: {
                        background: "#0B1C39",
                        color: "#fff",
                        borderLeft: "4px solid #3D96EB",
                      },
                    },
                  }}
                >
                  {(t) => (
                    <ToastBar
                      toast={t}
                      style={{
                        ...t.style,
                        animation: t.visible
                          ? "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                          : "toastSlideOut 0.2s forwards",
                      }}
                    >
                      {({ icon, message }) => (
                        <div className="custom-toast-wrapper">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              width: "100%",
                            }}
                          >
                            {icon}
                            <div
                              style={{
                                flex: 1,
                                minWidth: 0,
                                wordBreak: "break-word",
                              }}
                            >
                              {message}
                            </div>
                            {t.type !== "loading" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.dismiss(t.id);
                                }}
                                aria-label="Close notification"
                                className="toast-close-btn"
                              >
                                <XMarkIcon
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    pointerEvents: "none",
                                  }}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </ToastBar>
                  )}
                </Toaster>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
