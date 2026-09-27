// frontend/src/components/common/RoutePrefetcher.jsx
//
// Optional, lightweight prefetcher.
//
// Attach to the root of the Layout so it can listen to link hovers.
// Prefetches data for the most common navigations:
//   - product links  → /api/products/:slug
//   - shop links     → /api/products?...  (only the base /shop page)
//
// Zero visual impact. Fails silently on error.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const extractSlug = (href, prefix) => {
  if (!href) return null;
  const clean = href.split("?")[0];
  if (!clean.startsWith(prefix)) return null;
  const slug = clean.slice(prefix.length);
  return slug && slug.length > 0 ? slug : null;
};

const RoutePrefetcher = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeoutRef = { current: null };

    const prefetchProduct = (slug) => {
      queryClient.prefetchQuery({
        queryKey: ["product", slug],
        queryFn: async () => {
          const { data } = await axios.get(`${API_URL}/products/${slug}`);
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });
    };

    const prefetchShop = () => {
      queryClient.prefetchQuery({
        queryKey: ["products", "page=1&limit=12&sort=name-asc"],
        queryFn: async () => {
          const { data } = await axios.get(
            `${API_URL}/products?page=1&limit=12&sort=name-asc`,
          );
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });
    };

    const handleOver = (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;

      const productSlug = extractSlug(a.getAttribute("href"), "/product/");
      if (productSlug) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // 80ms debounce — cancels if user is just scrolling past.
        timeoutRef.current = setTimeout(() => prefetchProduct(productSlug), 80);
        return;
      }

      const href = a.getAttribute("href") || "";
      if (href === "/shop" || href.startsWith("/shop/")) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => prefetchShop(), 80);
      }
    };

    document.addEventListener("pointerover", handleOver, { passive: true });
    return () => {
      document.removeEventListener("pointerover", handleOver);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [queryClient]);

  return null;
};

export default RoutePrefetcher;
