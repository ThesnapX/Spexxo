import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartFromAPI();
    } else {
      fetchCartFromLocal();
    }
  }, [isAuthenticated]);

  // Fetch from API (logged in)
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
            });
          } catch (e) {
            /* ignore duplicates */
          }
        }
        localStorage.removeItem("guestCart");
        const { data: updatedData } = await axios.get(`${API_URL}/cart`);
        setCart(updatedData.cart || { items: [] });
      } else {
        setCart(data.cart || { items: [] });
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  // Fetch from localStorage (guest)
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

  // Save to localStorage
  const saveToLocal = (cartData) => {
    localStorage.setItem("guestCart", JSON.stringify(cartData));
  };

  // Refresh cart with latest product data
  const refreshCartWithLatestData = async () => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${API_URL}/cart`);
        setCart(data.cart || { items: [] });
        return data.cart;
      } catch (error) {
        console.error("Failed to refresh cart:", error);
        return null;
      }
    } else {
      // For guest cart, fetch fresh product data
      try {
        const currentCart = { ...cart };
        if (!currentCart.items) currentCart.items = [];

        const { data: allProducts } = await axios.get(
          `${API_URL}/products?limit=200&includeInactive=true`,
        );

        const products = allProducts.products || [];
        const productMap = {};
        products.forEach((product) => {
          productMap[product._id] = product;
        });

        let updated = false;
        for (const item of currentCart.items) {
          const productId =
            typeof item.product === "object" ? item.product?._id : item.product;
          const freshProduct = productMap[productId];
          if (freshProduct) {
            // Update product data (price will be read from product)
            item.product = freshProduct;
            item.image = freshProduct.images?.[0]?.url || "";

            // Check stock limit
            if (item.quantity > freshProduct.stock) {
              item.quantity = Math.max(1, freshProduct.stock || 0);
              updated = true;
            }
          }
        }

        setCart(currentCart);
        saveToLocal(currentCart);
        if (updated) {
          toast.warning("Some quantities were adjusted due to stock limits");
        }
        return currentCart;
      } catch (error) {
        console.error("Failed to refresh guest cart:", error);
        return null;
      }
    }
  };

  // Update addToCart function to handle variants
  const addToCart = async (productId, quantity = 1, variant = null) => {
    if (isAuthenticated) {
      try {
        // Check stock for variant
        let stockCheck = 0;
        if (variant) {
          // Check variant stock
          const { data: productData } = await axios.get(
            `${API_URL}/products/${productId}`,
          );
          const foundVariant = productData.product.variants?.find(
            (v) => v._id === variant._id || v.name === variant.name,
          );
          stockCheck = foundVariant?.stock || 0;
          if (stockCheck < quantity) {
            toast.error(`Only ${stockCheck} items available for this variant`);
            return;
          }
        } else {
          // Check main product stock
          const { data: productData } = await axios.get(
            `${API_URL}/products/${productId}`,
          );
          stockCheck = productData.product.stock || 0;
          if (stockCheck < quantity) {
            toast.error(`Only ${stockCheck} items available in stock`);
            return;
          }
        }

        const { data } = await axios.post(`${API_URL}/cart`, {
          productId,
          quantity,
          variant, // Pass variant to backend
        });

        await refreshCartWithLatestData();
        toast.success("Added to cart! 🛒");
        return data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add to cart");
        throw error;
      }
    } else {
      // GUEST CART - Update localStorage
      const currentCart = { ...cart };
      if (!currentCart.items) currentCart.items = [];

      // Fetch fresh product info
      const { data: productData } = await axios.get(
        `${API_URL}/products/${productId}`,
      );
      const product = productData.product;

      if (!product) {
        toast.error("Product not found");
        return;
      }

      // Check variant stock for guest
      if (variant) {
        const foundVariant = product.variants?.find(
          (v) => v._id === variant._id || v.name === variant.name,
        );
        if (foundVariant && foundVariant.stock < quantity) {
          toast.error(
            `Only ${foundVariant.stock} items available for this variant`,
          );
          return;
        }
      } else if (product.stock < quantity) {
        toast.error(`Only ${product.stock} items available in stock`);
        return;
      }

      // Create a unique key for cart item (product + variant)
      const variantKey = variant ? JSON.stringify(variant) : "default";

      const existingIndex = currentCart.items.findIndex((item) => {
        const itemVariantKey = item.variant
          ? JSON.stringify(item.variant)
          : "default";
        return (
          (item.product?._id || item.product) === productId &&
          itemVariantKey === variantKey
        );
      });

      if (existingIndex > -1) {
        const newQty = currentCart.items[existingIndex].quantity + quantity;
        // Check stock again for new total
        if (variant) {
          const foundVariant = product.variants?.find(
            (v) => v._id === variant._id || v.name === variant.name,
          );
          if (foundVariant && newQty > foundVariant.stock) {
            toast.error(
              `Only ${foundVariant.stock} items available for this variant`,
            );
            return;
          }
        } else if (newQty > product.stock) {
          toast.error(`Only ${product.stock} items available in stock`);
          return;
        }
        currentCart.items[existingIndex].quantity = newQty;
        currentCart.items[existingIndex].product = product;
        currentCart.items[existingIndex].variant = variant || null;
      } else {
        currentCart.items.push({
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          product: product,
          quantity,
          image: product.images?.[0]?.url || "",
          variant: variant || null,
        });
      }

      setCart(currentCart);
      saveToLocal(currentCart);
      toast.success("Added to cart! 🛒");
      return { success: true, cart: currentCart };
    }
  };

  // Update quantity with stock validation
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    if (isAuthenticated) {
      try {
        // First, check stock limit
        const { data: cartData } = await axios.get(`${API_URL}/cart`);
        const item = cartData.cart?.items?.find((i) => i._id === itemId);
        if (item && item.product && quantity > item.product.stock) {
          toast.error(`Only ${item.product.stock} items available in stock`);
          return;
        }

        await axios.put(`${API_URL}/cart/${itemId}`, { quantity });
        await refreshCartWithLatestData();
        return;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update cart");
        throw error;
      }
    } else {
      // GUEST - Use localStorage
      const currentCart = { ...cart };
      const itemIndex = currentCart.items?.findIndex(
        (item) => item._id === itemId,
      );
      if (itemIndex === -1 || itemIndex === undefined) return;

      const item = currentCart.items[itemIndex];
      const product = item.product;
      if (product && product.stock !== undefined && product.stock !== null) {
        if (quantity > product.stock) {
          toast.error(`Only ${product.stock} items available in stock`);
          return;
        }
      }

      item.quantity = quantity;
      setCart(currentCart);
      saveToLocal(currentCart);
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/cart/${itemId}`);
        await refreshCartWithLatestData();
        toast.success("Removed from cart");
        return;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to remove");
        throw error;
      }
    } else {
      const currentCart = { ...cart };
      currentCart.items =
        currentCart.items?.filter((item) => item._id !== itemId) || [];
      setCart(currentCart);
      saveToLocal(currentCart);
      toast.success("Removed from cart");
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/cart`);
        setCart({ items: [] });
      } catch (error) {
        console.error("Failed to clear cart:", error);
      }
    } else {
      setCart({ items: [] });
      localStorage.removeItem("guestCart");
    }
    setAppliedCoupon(null);
  };

  // Coupon functions
  const applyCoupon = (couponData) => {
    setAppliedCoupon(couponData);
  };

  // Remove all deactivated items from cart
  const removeDeactivatedItems = async () => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${API_URL}/cart`);
        const deactivatedItems =
          data.cart?.items?.filter(
            (item) => item.product?.isActive === false,
          ) || [];

        for (const item of deactivatedItems) {
          await axios.delete(`${API_URL}/cart/${item._id}`);
        }

        await refreshCartWithLatestData();
        return { success: true };
      } catch (error) {
        console.error("Failed to remove deactivated items:", error);
        return { success: false };
      }
    } else {
      const currentCart = { ...cart };
      currentCart.items =
        currentCart.items?.filter((item) => item.product?.isActive !== false) ||
        [];
      setCart(currentCart);
      saveToLocal(currentCart);
      return { success: true };
    }
  };

  // Refresh cart
  const refreshCart = async () => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${API_URL}/cart`);
        setCart(data.cart);
        return data.cart;
      } catch (error) {
        console.error("Failed to refresh cart:", error);
        return null;
      }
    } else {
      fetchCartFromLocal();
      return cart;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculate totals - ONLY for active products with latest prices
  const cartItems = cart?.items || [];

  // Filter out deactivated products for counts
  const activeItems = cartItems.filter(
    (item) => item.product?.isActive !== false,
  );

  const cartCount = activeItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  const activeCartCount = cartCount;

  // Calculate total using product's current price
  const cartTotal = activeItems.reduce((sum, item) => {
    const price = item.product?.comparePrice || item.product?.price || 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  const value = {
    cart,
    loading,
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
