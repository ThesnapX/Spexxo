// frontend/src/utils/useMetaPixel.js

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "./metaPixel";
import { useAuth } from "../context/AuthContext";

/**
 * Fires exactly one PageView per client-side navigation.
 *
 * - First call fires the boot PageView (matching index.html's flag).
 * - Subsequent pathname changes fire again.
 * - Query-string-only changes do NOT re-fire.
 */
export const useMetaPageView = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathnameRef = useRef(null);
  const bootFiredRef = useRef(false);

  useEffect(() => {
    // ── Boot PageView ──
    if (!bootFiredRef.current) {
      bootFiredRef.current = true;
      lastPathnameRef.current = location.pathname;

      // Set the global flag so any legacy check stays consistent.
      if (typeof window !== "undefined") {
        window.__SPEXXO_INITIAL_PAGEVIEW_FIRED__ = true;
      }

      // Fire through the full pipeline (browser + CAPI + advanced matching).
      trackPageView(user).catch(() => {});
      return;
    }

    // ── Route change PageView ──
    if (location.pathname === lastPathnameRef.current) return;
    lastPathnameRef.current = location.pathname;
    trackPageView(user).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
};
