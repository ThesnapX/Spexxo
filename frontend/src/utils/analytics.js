// frontend/src/utils/analytics.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get or create a per-tab sessionId. Persisted in sessionStorage so it
// survives reload within the same tab, cleared when the tab closes.
const getSessionId = () => {
  try {
    let sid = sessionStorage.getItem("spexxo_session_id");
    if (!sid) {
      sid =
        "s_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("spexxo_session_id", sid);
    }
    return sid;
  } catch {
    return null;
  }
};

export const initGA = () => {};

export const pageview = () => {};

export const trackVisit = () => {
  try {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/analytics/visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* silent */
  }
};

// Called once per app boot from Layout.
export const initAnalytics = () => {
  trackVisit();
};

export const event = () => {};
export const viewItem = () => {};
export const addToCart = () => {};
export const beginCheckout = () => {};
export const purchase = () => {};
