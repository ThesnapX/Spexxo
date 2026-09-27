// frontend/src/context/CartContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { trackAddToCart } from "../utils/metaPixel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

// ─────────────────────────────────────────────
// Variant identity matcher.
//
// Priority: _id  >  sku  >  name
//
// Never match purely on `name` if `_id` or `sku` is available — names can
// collide (e.g. two variants both called "Black").
// ─────────────────────────────────────────────
const variantMatches = (a, b) => {
  if (!a || !b) return false;

  const aid = a._id ? String(a._id) : null;
  const bid = b._id ? String(b._id) : null;
  if (aid && bid) return aid === bid;

  const asku = a.sku ? String(a.sku) : null;
  const bsku = b.sku ? String(b.sku) : null;
  if (asku && bsku) return asku === bsku;

  const an = a.name ? String(a.name) : null;
  const bn = b.name ? String(b.name) : null;
  if (an && bn) return an === bn;

  return false;
};

// Defensive numeric parser — returns null if not finite non-negative.
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartFromAPI();
    } else {
      fetchCartFromLocal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Fetch from API ──
  const fetchCartFromAPI = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/cart`);
      const localCart = JSON.parse(
        localStorage.getItem("guestCart") || '{"items":[]}',
      );

      if (localCart.items.length > 0) {
        for (const item of localCart.items) {
          try {
            await axios.post(`${API_URL}/cart`, {
              productId: item.product?._id || item.product,
              quantity: item.quantity,
              variant: item.variant || null,
            });
          } catch {
            /* ignore individual merge failures */
          }
        }
        localStorage.removeItem("guestCart");
        const { data: updatedData } = await axios.get(`${API_URL}/cart`);
        setCart(updatedData.cart || { items: [] });
      } else {
        setCart(data.cart || { items: [] });
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error.message);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchCartFromLocal = () => {
    try {
      const localCart = JSON.parse(
        localStorage.getItem("guestCart") || '{"items":[]}',
      );
      setCart(localCart);
    } catch {
      setCart({ items: [] });
    }
  };

  const saveToLocal = (cartData) => {
    localStorage.setItem("guestCart", JSON.stringify(cartData));
  };

  // ── Refresh with latest DB data ──
  const refreshCartWithLatestData = async () => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${API_URL}/cart`);
        if (data.cart?.items) {
          data.cart.items = data.cart.items.filter(
            (item) => item.product !== null,
          );
        }
        setCart(data.cart || { items: [] });
        return data.cart;
      } catch (error) {
        console.error("Failed to refresh cart:", error.message);
        return null;
      }
    }

    // Guest cart: re-fetch products to sync stock / price.
    try {
      const currentCart = { ...cart };
      if (!currentCart.items) currentCart.items = [];

      const { data: allProducts } = await axios.get(
        `${API_URL}/products?limit=200&includeInactive=true`,
      );
      const products = allProducts.products || [];
      const productMap = {};
      products.forEach((p) => {
        productMap[p._id] = p;
      });

      let updated = false;
      const updatedItems = [];

      for (const item of currentCart.items) {
        const productId =
          typeof item.product === "object" ? item.product?._id : item.product;
        const fresh = productMap[productId];

        if (!fresh) {
          updated = true;
          continue;
        }

        item.product = fresh;
        item.image = fresh.images?.[0]?.url || "";

        let stockToCheck = safeNumber(fresh.stock) ?? 0;

        if (item.variant) {
          const foundVariant = fresh.variants?.find((v) =>
            variantMatches(v, item.variant),
          );
          if (foundVariant) {
            stockToCheck = safeNumber(foundVariant.stock) ?? 0;
            const vp = safeNumber(foundVariant.price);
            if (vp !== null) item.price = vp;
          }
        }

        if (item.quantity > stockToCheck && stockToCheck > 0) {
          item.quantity = Math.min(item.quantity, stockToCheck);
          updated = true;
        } else if (stockToCheck === 0) {
          updated = true;
          continue;
        }
        updatedItems.push(item);
      }

      currentCart.items = updatedItems;
      setCart(currentCart);
      saveToLocal(currentCart);

      if (updated) {
        toast.warning("Some items were removed or quantities adjusted");
      }
      return currentCart;
    } catch (error) {
      console.error("Failed to refresh guest cart:", error.message);
      return null;
    }
  };

  // ─────────────────────────────────────────────
  // ADD TO CART
  // Fires AddToCart tracking exactly once, on success, with the
  // actual DB price. Never sends NaN / undefined to Meta.
  // ─────────────────────────────────────────────
  const addToCart = async (productId, quantity = 1, variant = null) => {
    if (isAddingToCart) {
      toast.info("Please wait...");
      return;
    }
    setIsAddingToCart(true);

    try {
      const { data: productData } = await axios.get(
        `${API_URL}/products/${productId}`,
      );
      const product = productData.product;

      if (!product) {
        toast.error("Product not found");
        setIsAddingToCart(false);
        return;
      }
      if (product.isActive === false) {
        toast.error("This product is currently deactivated");
        setIsAddingToCart(false);
        return;
      }

      let stockToCheck = safeNumber(product.stock) ?? 0;
      let variantPrice = null;
      let variantName = null;
      let variantSku = null;
      let variantColor = null;

      if (variant) {
        const foundVariant = product.variants?.find((v) =>
          variantMatches(v, variant),
        );
        if (foundVariant) {
          stockToCheck = safeNumber(foundVariant.stock) ?? 0;
          variantPrice = safeNumber(foundVariant.price);
          variantName = foundVariant.name;
          variantSku = foundVariant.sku;
          variantColor = foundVariant.color;
        } else {
          toast.error("Selected variant not found");
          setIsAddingToCart(false);
          return;
        }
      }

      if (stockToCheck < quantity) {
        toast.error(`Only ${stockToCheck} items available in stock`);
        setIsAddingToCart(false);
        return;
      }

      const variantData = variant
        ? {
            _id: variant._id || null,
            name: variantName || variant.name,
            sku: variantSku || variant.sku || "",
            price: variantPrice ?? safeNumber(variant.price) ?? 0,
            color: variantColor || variant.color || null,
            attributes: variant.attributes || {},
          }
        : null;

      // ── Persist ──
      if (isAuthenticated) {
        await axios.post(`${API_URL}/cart`, {
          productId,
          quantity,
          variant: variantData,
        });
        await refreshCartWithLatestData();
      } else {
        const currentCart = { ...cart };
        if (!currentCart.items) currentCart.items = [];

        const existingIndex = currentCart.items.findIndex((item) => {
          const sameProduct = (item.product?._id || item.product) === productId;
          if (!sameProduct) return false;
          if (!variantData) return !item.variant;
          return variantMatches(item.variant, variantData);
        });

        const basePrice =
          variantPrice ??
          safeNumber(product.comparePrice || product.price) ??
          0;

        if (existingIndex > -1) {
          const newQty = currentCart.items[existingIndex].quantity + quantity;
          if (newQty > stockToCheck) {
            toast.error(`Only ${stockToCheck} items available in stock`);
            setIsAddingToCart(false);
            return;
          }
          currentCart.items[existingIndex].quantity = newQty;
          currentCart.items[existingIndex].product = product;
          currentCart.items[existingIndex].variant = variantData;
          currentCart.items[existingIndex].price = basePrice;
        } else {
          currentCart.items.push({
            _id:
              Date.now().toString() +
              Math.random().toString(36).substring(2, 7),
            product,
            quantity,
            image: product.images?.[0]?.url || "",
            variant: variantData,
            price: basePrice,
          });
        }

        setCart(currentCart);
        saveToLocal(currentCart);
      }

      // ── Fire AddToCart exactly once, after success. ──
      trackAddToCart(product, quantity, variantData).catch(() => {});

      toast.success("Added to cart! 🛒");
    } catch (error) {
      if (isAuthenticated) {
        await refreshCartWithLatestData();
      }
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ── Update quantity ──
  const updateQuantity = async (itemId, quantity) => {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("Quantity must be a positive integer");
      return;
    }

    if (isAuthenticated) {
      try {
        const { data: cartData } = await axios.get(`${API_URL}/cart`);
        const item = cartData.cart?.items?.find((i) => i._id === itemId);
        if (item) {
          let stockToCheck = safeNumber(item.product?.stock) ?? 0;
          if (item.variant && item.product?.variants) {
            const found = item.product.variants.find((v) =>
              variantMatches(v, item.variant),
            );
            if (found) stockToCheck = safeNumber(found.stock) ?? 0;
          }
          if (qty > stockToCheck) {
            toast.error(`Only ${stockToCheck} items available in stock`);
            return;
          }
        }
        await axios.put(`${API_URL}/cart/${itemId}`, { quantity: qty });
        await refreshCartWithLatestData();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update cart");
        throw error;
      }
      return;
    }

    // Guest
    const currentCart = { ...cart };
    const itemIndex = currentCart.items?.findIndex((i) => i._id === itemId);
    if (itemIndex === -1 || itemIndex === undefined) return;

    const item = currentCart.items[itemIndex];
    let stockToCheck = safeNumber(item.product?.stock) ?? 0;
    if (item.variant && item.product?.variants) {
      const found = item.product.variants.find((v) =>
        variantMatches(v, item.variant),
      );
      if (found) stockToCheck = safeNumber(found.stock) ?? 0;
    }
    if (qty > stockToCheck) {
      toast.error(`Only ${stockToCheck} items available in stock`);
      return;
    }
    item.quantity = qty;
    setCart(currentCart);
    saveToLocal(currentCart);
  };

  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/cart/${itemId}`);
        await refreshCartWithLatestData();
        toast.success("Removed from cart");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to remove");
        throw error;
      }
      return;
    }

    const currentCart = { ...cart };
    currentCart.items =
      currentCart.items?.filter((i) => i._id !== itemId) || [];
    setCart(currentCart);
    saveToLocal(currentCart);
    toast.success("Removed from cart");
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/cart`);
        setCart({ items: [] });
      } catch (error) {
        console.error("Failed to clear cart:", error.message);
      }
    } else {
      setCart({ items: [] });
      localStorage.removeItem("guestCart");
    }
    setAppliedCoupon(null);
  };

  const applyCoupon = (couponData) => setAppliedCoupon(couponData);
  const removeCoupon = () => setAppliedCoupon(null);

  const removeDeactivatedItems = async () => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${API_URL}/cart`);
        const deactivated =
          data.cart?.items?.filter(
            (item) => item.product?.isActive === false,
          ) || [];
        for (const item of deactivated) {
          await axios.delete(`${API_URL}/cart/${item._id}`);
        }
        await refreshCartWithLatestData();
        return { success: true };
      } catch (error) {
        console.error("Failed to remove deactivated items:", error.message);
        return { success: false };
      }
    }

    const currentCart = { ...cart };
    currentCart.items =
      currentCart.items?.filter((i) => i.product?.isActive !== false) || [];
    setCart(currentCart);
    saveToLocal(currentCart);
    return { success: true };
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${API_URL}/cart`);
        setCart(data.cart);
        return data.cart;
      } catch (error) {
        console.error("Failed to refresh cart:", error.message);
        return null;
      }
    }
    fetchCartFromLocal();
    return cart;
  };

  const cartItems = cart?.items || [];
  const activeItems = cartItems.filter(
    (item) => item.product?.isActive !== false && item.product !== null,
  );
  const cartCount = activeItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );
  const activeCartCount = cartCount;

  const cartTotal = activeItems.reduce((sum, item) => {
    const price =
      safeNumber(item.price) ??
      safeNumber(item.product?.comparePrice) ??
      safeNumber(item.product?.price) ??
      0;
    return sum + price * (Number(item.quantity) || 0);
  }, 0);

  const value = {
    cart,
    loading,
    isAddingToCart,
    cartCount,
    activeCartCount,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCartFromAPI,
    removeDeactivatedItems,
    refreshCart,
    refreshCartWithLatestData,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
