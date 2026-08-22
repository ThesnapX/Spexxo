// frontend/src/context/CartContext.jsx

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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
              variant: item.variant || null,
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

  // Refresh cart with latest data
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
        console.error("Failed to refresh cart:", error);
        return null;
      }
    } else {
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
        const updatedItems = [];

        for (const item of currentCart.items) {
          const productId =
            typeof item.product === "object" ? item.product?._id : item.product;
          const freshProduct = productMap[productId];

          if (freshProduct) {
            item.product = freshProduct;
            item.image = freshProduct.images?.[0]?.url || "";

            // Check stock based on variant or main product
            let stockToCheck = freshProduct.stock;
            if (item.variant) {
              const foundVariant = freshProduct.variants?.find(
                (v) =>
                  v._id?.toString() === item.variant?._id?.toString() ||
                  v.name === item.variant?.name ||
                  v.sku === item.variant?.sku,
              );
              if (foundVariant) {
                stockToCheck = foundVariant.stock || 0;
                // Update variant price if changed
                if (foundVariant.price) {
                  item.price = foundVariant.price;
                }
              }
            }

            if (item.quantity > stockToCheck && stockToCheck > 0) {
              item.quantity = Math.min(item.quantity, stockToCheck);
              updated = true;
            } else if (stockToCheck === 0) {
              updated = true;
              continue; // Remove out of stock items
            }
            updatedItems.push(item);
          } else {
            updated = true;
          }
        }

        currentCart.items = updatedItems;
        setCart(currentCart);
        saveToLocal(currentCart);

        if (updated) {
          toast.warning("Some items were removed or quantities adjusted");
        }
        return currentCart;
      } catch (error) {
        console.error("Failed to refresh guest cart:", error);
        return null;
      }
    }
  };

  // Add to Cart with variant support
  const addToCart = async (productId, quantity = 1, variant = null) => {
    if (isAddingToCart) {
      toast.info("Please wait...");
      return;
    }
    setIsAddingToCart(true);

    if (isAuthenticated) {
      try {
        // Check stock
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

        let stockToCheck = product.stock;
        let variantPrice = null;
        let variantName = null;
        let variantSku = null;
        let variantColor = null;

        if (variant) {
          const foundVariant = product.variants?.find(
            (v) =>
              v._id?.toString() === variant._id?.toString() ||
              v.name === variant.name ||
              v.sku === variant.sku,
          );
          if (foundVariant) {
            stockToCheck = foundVariant.stock || 0;
            variantPrice = foundVariant.price;
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

        // Prepare variant data for storage
        const variantData = variant
          ? {
              _id: variant._id || null,
              name: variantName || variant.name,
              sku: variantSku || variant.sku || "",
              price: variantPrice || variant.price || 0,
              color: variantColor || variant.color || null,
              attributes: variant.attributes || {},
            }
          : null;

        // Send to backend
        const { data } = await axios.post(`${API_URL}/cart`, {
          productId,
          quantity,
          variant: variantData,
        });

        // Refresh cart from backend
        await refreshCartWithLatestData();
        toast.success("Added to cart! 🛒");
        setIsAddingToCart(false);
        return data;
      } catch (error) {
        await refreshCartWithLatestData();
        toast.error(error.response?.data?.message || "Failed to add to cart");
        setIsAddingToCart(false);
        throw error;
      }
    } else {
      // Guest cart
      try {
        const currentCart = { ...cart };
        if (!currentCart.items) currentCart.items = [];

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

        let stockToCheck = product.stock;
        let variantPrice = null;
        let variantName = null;
        let variantSku = null;
        let variantColor = null;

        if (variant) {
          const foundVariant = product.variants?.find(
            (v) =>
              v._id?.toString() === variant._id?.toString() ||
              v.name === variant.name ||
              v.sku === variant.sku,
          );
          if (foundVariant) {
            stockToCheck = foundVariant.stock || 0;
            variantPrice = foundVariant.price;
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

        // Prepare variant data for storage
        const variantData = variant
          ? {
              _id: variant._id || null,
              name: variantName || variant.name,
              sku: variantSku || variant.sku || "",
              price: variantPrice || variant.price || 0,
              color: variantColor || variant.color || null,
              attributes: variant.attributes || {},
            }
          : null;

        const variantKey = variantData
          ? JSON.stringify(variantData)
          : "default";

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
          if (newQty > stockToCheck) {
            toast.error(`Only ${stockToCheck} items available in stock`);
            setIsAddingToCart(false);
            return;
          }
          currentCart.items[existingIndex].quantity = newQty;
          currentCart.items[existingIndex].product = product;
          currentCart.items[existingIndex].variant = variantData;
          currentCart.items[existingIndex].price =
            variantPrice || product.comparePrice || product.price || 0;
        } else {
          currentCart.items.push({
            _id:
              Date.now().toString() +
              Math.random().toString(36).substring(2, 7),
            product: product,
            quantity,
            image: product.images?.[0]?.url || "",
            variant: variantData,
            price: variantPrice || product.comparePrice || product.price || 0,
          });
        }

        setCart(currentCart);
        saveToLocal(currentCart);
        toast.success("Added to cart! 🛒");
        setIsAddingToCart(false);
        return { success: true, cart: currentCart };
      } catch (error) {
        console.error("Guest add to cart error:", error);
        toast.error("Failed to add to cart");
        setIsAddingToCart(false);
        return { success: false };
      }
    }
  };

  // Update quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    if (isAuthenticated) {
      try {
        const { data: cartData } = await axios.get(`${API_URL}/cart`);
        const item = cartData.cart?.items?.find((i) => i._id === itemId);

        if (item) {
          let stockToCheck = item.product?.stock || 0;
          if (item.variant && item.product?.variants) {
            const foundVariant = item.product.variants.find(
              (v) =>
                v._id?.toString() === item.variant?._id?.toString() ||
                v.name === item.variant?.name ||
                v.sku === item.variant?.sku,
            );
            if (foundVariant) {
              stockToCheck = foundVariant.stock || 0;
            }
          }
          if (quantity > stockToCheck) {
            toast.error(`Only ${stockToCheck} items available in stock`);
            return;
          }
        }

        await axios.put(`${API_URL}/cart/${itemId}`, { quantity });
        await refreshCartWithLatestData();
        return;
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update cart");
        throw error;
      }
    } else {
      const currentCart = { ...cart };
      const itemIndex = currentCart.items?.findIndex(
        (item) => item._id === itemId,
      );
      if (itemIndex === -1 || itemIndex === undefined) return;

      const item = currentCart.items[itemIndex];
      let stockToCheck = item.product?.stock || 0;
      if (item.variant && item.product?.variants) {
        const foundVariant = item.product.variants.find(
          (v) =>
            v._id?.toString() === item.variant?._id?.toString() ||
            v.name === item.variant?.name ||
            v.sku === item.variant?.sku,
        );
        if (foundVariant) {
          stockToCheck = foundVariant.stock || 0;
        }
      }

      if (quantity > stockToCheck) {
        toast.error(`Only ${stockToCheck} items available in stock`);
        return;
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

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Remove deactivated items
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

  // Calculate totals
  const cartItems = cart?.items || [];

  const activeItems = cartItems.filter(
    (item) => item.product?.isActive !== false && item.product !== null,
  );

  const cartCount = activeItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  const activeCartCount = cartCount;

  const cartTotal = activeItems.reduce((sum, item) => {
    const price =
      item.price || item.product?.comparePrice || item.product?.price || 0;
    return sum + price * (item.quantity || 0);
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
