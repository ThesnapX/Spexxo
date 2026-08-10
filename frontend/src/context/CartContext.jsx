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
        setCart(updatedData.cart);
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

  // Add to cart
  const addToCart = async (productId, quantity = 1, variant = null) => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.post(`${API_URL}/cart`, {
          productId,
          quantity,
          variant,
        });
        setCart(data.cart);
        toast.success("Added to cart! 🛒");
        return data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add to cart");
        throw error;
      }
    } else {
      // Guest - use localStorage with product fetch
      try {
        const currentCart = { ...cart };
        if (!currentCart.items) currentCart.items = [];

        let product = null;
        try {
          const { data: allProducts } = await axios.get(
            `${API_URL}/products?limit=200`,
          );
          product = allProducts?.products?.find((p) => p._id === productId);
        } catch (e) {
          console.log("Could not fetch product details for guest cart");
        }

        const existingIndex = currentCart.items.findIndex(
          (item) => (item.product?._id || item.product) === productId,
        );

        if (existingIndex > -1) {
          currentCart.items[existingIndex].quantity += quantity;
          if (product) {
            currentCart.items[existingIndex].product = product;
            currentCart.items[existingIndex].price =
              product.comparePrice || product.price;
            currentCart.items[existingIndex].image =
              product.images?.[0]?.url || "";
          }
        } else {
          currentCart.items.push({
            _id: Date.now().toString(),
            product: product || {
              _id: productId,
              name: "Product",
              slug: "",
              images: [],
              price: 0,
              brand: null,
            },
            quantity,
            price: product?.comparePrice || product?.price || 0,
            image: product?.images?.[0]?.url || "",
            variant: variant || null,
          });
        }

        setCart(currentCart);
        saveToLocal(currentCart);
        toast.success("Added to cart! 🛒");
      } catch (error) {
        toast.error("Failed to add to cart");
      }
    }
  };

  // Update quantity
  const updateQuantity = async (itemId, quantity) => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.put(`${API_URL}/cart/${itemId}`, {
          quantity,
        });
        setCart(data.cart);
        return data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update cart");
        throw error;
      }
    } else {
      const currentCart = { ...cart };
      const item = currentCart.items?.find((item) => item._id === itemId);
      if (item) {
        item.quantity = quantity;
        setCart(currentCart);
        saveToLocal(currentCart);
      }
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.delete(`${API_URL}/cart/${itemId}`);
        setCart(data.cart);
        toast.success("Removed from cart");
        return data;
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
  };

  const cartCount =
    cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const cartTotal =
    cart?.items?.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0,
    ) || 0;

  const value = {
    cart,
    loading,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCartFromAPI,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
