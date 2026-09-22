// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
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
                    // Reserve right-side padding for the close button
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
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#fff",
                      },
                    },
                    error: {
                      style: {
                        background: "#0B1C39",
                        color: "#fff",
                        borderLeft: "4px solid #ef4444",
                      },
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                      },
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
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                color: "rgba(255,255,255,0.55)",
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.12)";
                                e.currentTarget.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color =
                                  "rgba(255,255,255,0.55)";
                              }}
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
