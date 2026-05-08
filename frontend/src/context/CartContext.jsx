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
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/cart`);
      setCart(data.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1, variant = null) => {
    try {
      const { data } = await axios.post(`${API_URL}/cart`, {
        productId,
        quantity,
        variant,
      });
      setCart(data.cart);
      toast.success("Added to cart!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
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
  };

  const removeFromCart = async (itemId) => {
    try {
      const { data } = await axios.delete(`${API_URL}/cart/${itemId}`);
      setCart(data.cart);
      toast.success("Removed from cart");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove item");
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/cart`);
      setCart({ items: [] });
      toast.success("Cart cleared");
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const cartCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal =
    cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;

  const value = {
    cart,
    loading,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
