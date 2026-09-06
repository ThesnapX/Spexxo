// frontend/src/utils/analytics.js

// Google Analytics placeholder - prevents build errors
// To enable analytics, install react-ga4 and uncomment the code below

export const initGA = () => {
  // Placeholder - analytics not configured
  if (typeof window !== "undefined") {
    console.log("📊 Analytics is disabled (placeholder mode)");
  }
};

export const pageview = () => {
  // Placeholder
};

export const event = () => {
  // Placeholder
};

export const viewItem = () => {
  // Placeholder
};

export const addToCart = () => {
  // Placeholder
};

export const beginCheckout = () => {
  // Placeholder
};

export const purchase = () => {
  // Placeholder
};

// Uncomment below to enable Google Analytics
/*
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log("✅ Google Analytics initialized");
  } else {
    console.warn("⚠️ GA_MEASUREMENT_ID not found");
  }
};

export const pageview = (url) => {
  if (ReactGA.isInitialized) {
    ReactGA.send({ hitType: "pageview", page: url });
  }
};

export const event = ({ action, category, label, value }) => {
  if (ReactGA.isInitialized) {
    ReactGA.event({ action, category, label, value });
  }
};

export const viewItem = (product) => {
  if (ReactGA.isInitialized) {
    ReactGA.event({
      category: "Ecommerce",
      action: "view_item",
      label: product.name,
    });
  }
};

export const addToCart = (product, quantity) => {
  if (ReactGA.isInitialized) {
    ReactGA.event({
      category: "Ecommerce",
      action: "add_to_cart",
      label: product.name,
      value: product.price * quantity,
    });
  }
};

export const beginCheckout = (items, total) => {
  if (ReactGA.isInitialized) {
    ReactGA.event({
      category: "Ecommerce",
      action: "begin_checkout",
      label: "Checkout Started",
      value: total,
    });
  }
};

export const purchase = (order) => {
  if (ReactGA.isInitialized) {
    ReactGA.event({
      category: "Ecommerce",
      action: "purchase",
      label: order.orderNumber,
      value: order.total,
    });
  }
};
*/
