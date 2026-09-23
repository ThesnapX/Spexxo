// frontend/src/utils/useMetaPixel.js

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fires PageView on every route change (SPA-friendly)
 * The initial PageView is fired from index.html;
 * this handles subsequent navigations.
 */
export const useMetaPageView = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location.pathname]);
};
