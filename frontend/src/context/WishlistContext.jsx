import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
    else setWishlist([]);
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/wishlist`);
      // Only keep active products in the wishlist
      const activeWishlist =
        data.wishlist?.filter((product) => product?.isActive !== false) || [];
      setWishlist(activeWishlist);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!isAuthenticated) {
      return { requiresAuth: true };
    }

    try {
      const { data } = await axios.post(`${API_URL}/wishlist/${productId}`);
      // Filter to only active products
      const activeWishlist =
        data.wishlist?.filter((product) => product?.isActive !== false) || [];
      setWishlist(activeWishlist);
      toast.success("Added to wishlist!");
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to wishlist");
      return { success: false };
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await axios.delete(`${API_URL}/wishlist/${productId}`);
      // Filter to only active products
      const activeWishlist =
        data.wishlist?.filter((product) => product?.isActive !== false) || [];
      setWishlist(activeWishlist);
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove from wishlist",
      );
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  // Get only active products for display
  const activeWishlist = wishlist.filter(
    (product) => product?.isActive !== false,
  );

  const value = {
    wishlist: activeWishlist,
    wishlistCount: activeWishlist.length,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
