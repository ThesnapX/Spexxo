// frontend/src/components/layout/PopupManager.jsx

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { XMarkIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PopupManager = () => {
  const [visiblePopup, setVisiblePopup] = useState(null);
  const location = useLocation();

  const { data: popups } = useQuery({
    queryKey: ["popups", location.pathname],
    queryFn: async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/popups/active?path=${location.pathname}`,
        );
        return data.popups || [];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (popups && popups.length > 0) {
      const popup = popups[0];
      const hasBeenShown = sessionStorage.getItem(`popup_${popup._id}`);

      if (!hasBeenShown || popup.frequency === "every-visit") {
        const timer = setTimeout(
          () => {
            setVisiblePopup(popup);
            if (popup.frequency !== "every-visit") {
              sessionStorage.setItem(`popup_${popup._id}`, "true");
            }
          },
          popup.triggerDelay * 1000 || 0,
        );

        return () => clearTimeout(timer);
      }
    }
  }, [popups]);

  if (!visiblePopup) return null;

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied: ${text}`);
    } catch (error) {
      toast.error("Failed to copy text");
    }
  };

  // ✅ Debug: Log the popup data to see what's coming from API
  console.log("Popup Data:", visiblePopup);

  // ✅ Determine if button should be shown
  const buttonType = visiblePopup.buttonType || "visit";
  const showButton = buttonType !== "none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setVisiblePopup(null)}
      />

      {/* Popup Container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Highest z-index */}
        <button
          onClick={() => setVisiblePopup(null)}
          className="absolute -top-4 -right-4 z-50 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>

        {visiblePopup.image?.url ? (
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            {/* Image */}
            <img
              src={visiblePopup.image.url}
              alt={visiblePopup.image.alt || visiblePopup.name || "Popup"}
              className="max-w-[90vw] max-h-[75vh] w-auto h-auto object-contain"
              style={{ position: "relative", zIndex: 1 }}
            />

            {/* ✅ Glassmorphism Button Overlay at Bottom */}
            {showButton && (
              <div
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                style={{ zIndex: 10 }}
              >
                <div className="flex justify-center">
                  {/* ✅ VISIT BUTTON */}
                  {buttonType === "visit" && visiblePopup.buttonLink && (
                    <a
                      href={visiblePopup.buttonLink}
                      target={
                        visiblePopup.buttonLink.startsWith("http")
                          ? "_blank"
                          : "_self"
                      }
                      rel="noopener noreferrer"
                      className="px-8 py-3 text-white font-semibold rounded-full transition shadow-lg backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {visiblePopup.buttonText || "Shop Now"}
                    </a>
                  )}

                  {/* ✅ COPY BUTTON */}
                  {buttonType === "copy" && visiblePopup.buttonCopyText && (
                    <button
                      className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-full transition shadow-lg backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(visiblePopup.buttonCopyText);
                      }}
                    >
                      <ClipboardIcon className="w-5 h-5" />
                      {visiblePopup.buttonText || "Copy"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto text-center">
            <p className="text-text-light">No image uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupManager;
