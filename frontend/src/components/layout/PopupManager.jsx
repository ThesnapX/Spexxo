import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

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
        return data.popups;
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setVisiblePopup(null)}
      />
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl animate-fade-in">
        <button
          onClick={() => setVisiblePopup(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {visiblePopup.image?.url && (
          <img
            src={visiblePopup.image.url}
            alt={visiblePopup.image.alt || ""}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        {visiblePopup.title && (
          <h2 className="text-2xl font-bold text-text mb-2">
            {visiblePopup.title}
          </h2>
        )}

        {visiblePopup.content && (
          <p className="text-text-light mb-6">{visiblePopup.content}</p>
        )}

        {visiblePopup.buttonText && (
          <Link
            to={visiblePopup.buttonLink || "#"}
            className="btn-primary inline-block text-center w-full"
            onClick={() => setVisiblePopup(null)}
          >
            {visiblePopup.buttonText}
          </Link>
        )}
      </div>
    </div>
  );
};

export default PopupManager;
