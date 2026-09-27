// frontend/src/utils/useMetaPixel.js

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Fires exactly one PageView per client-side navigation.
 *
 * Rules:
 *   - Initial PageView is fired from index.html before React mounts.
 *   - The first run of this hook CONSUMES the boot flag and does NOT fire.
 *   - Subsequent pathname changes fire one PageView each.
 *   - Query-string-only changes (e.g. /shop?page=2) do NOT re-fire.
 *   - Rapid consecutive navigations within the same pathname do NOT duplicate.
 */
export const useMetaPageView = () => {
  const location = useLocation();
  const lastPathnameRef = useRef(null);
  const consumedBootFlagRef = useRef(false);

  useEffect(() => {
    // ── First run: consume the boot flag, do not fire. ──
    if (!consumedBootFlagRef.current) {
      consumedBootFlagRef.current = true;
      lastPathnameRef.current = location.pathname;
      if (
        typeof window !== "undefined" &&
        window.__SPEXXO_INITIAL_PAGEVIEW_FIRED__
      ) {
        // Boot fired PageView already; do nothing.
        return;
      }
      // Boot flag missing (e.g. FB blocked, script delayed).
      // Fire one PageView to be safe — better to count once than zero times.
      if (typeof window !== "undefined" && window.fbq) {
        try {
          window.fbq("track", "PageView");
        } catch {
          /* silent */
        }
      }
      return;
    }

    // ── Subsequent runs: only fire on real pathname change. ──
    if (location.pathname === lastPathnameRef.current) {
      return;
    }
    lastPathnameRef.current = location.pathname;

    if (typeof window !== "undefined" && window.fbq) {
      try {
        window.fbq("track", "PageView");
      } catch {
        /* silent */
      }
    }
  }, [location.pathname]);
};
