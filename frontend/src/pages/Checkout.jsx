// frontend/src/pages/Checkout.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  MapPinIcon,
  PlusIcon,
  CheckCircleIcon,
  HomeIcon,
  BriefcaseIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  TicketIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
import AddressForm from "../components/common/AddressForm";

const Checkout = () => {
  const location = useLocation();
  const {
    cart,
    cartTotal,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    refreshCartWithLatestData,
  } = useCart();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressList, setShowAddressList] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);

  // ✅ Buy Now state
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [buyNowCartTotal, setBuyNowCartTotal] = useState(0);
  const [buyNowItems, setBuyNowItems] = useState([]);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ✅ Track if Razorpay script is loaded
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [razorpayLoadAttempted, setRazorpayLoadAttempted] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    area: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });

  // Check for deactivated products
  const hasDeactivatedProducts = cart.items.some(
    (item) => item.product?.isActive === false,
  );

  // Check if running on localhost
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // ✅ Check for Buy Now on mount
  useEffect(() => {
    const buyNowData = sessionStorage.getItem("buyNowItem");
    if (buyNowData) {
      try {
        const item = JSON.parse(buyNowData);
        setBuyNowItem(item);
        setIsBuyNow(true);
        setBuyNowItems([item]);
        setBuyNowCartTotal(item.price * item.quantity);
        console.log("[CHECKOUT] Buy Now mode activated for:", item.name);
        sessionStorage.removeItem("buyNowItem");
      } catch (e) {
        console.error("[CHECKOUT] Failed to parse buyNowItem:", e);
      }
    }
  }, []);

  // Load default address on mount
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultAddr =
        user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        setForm({
          fullName:
            defaultAddr.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          phone: defaultAddr.phone || user.phone || "",
          addressLine1: defaultAddr.addressLine1 || "",
          addressLine2: defaultAddr.addressLine2 || "",
          landmark: defaultAddr.landmark || "",
          area: defaultAddr.area || "",
          city: defaultAddr.city || "",
          state: defaultAddr.state || "Maharashtra",
          pincode: defaultAddr.pincode || "",
        });
        setUseSavedAddress(true);
      }
    } else if (user?.defaultAddress?.addressLine1) {
      setForm({
        fullName:
          user.defaultAddress.fullName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        phone: user.defaultAddress.phone || user.phone || "",
        addressLine1: user.defaultAddress.addressLine1 || "",
        addressLine2: user.defaultAddress.addressLine2 || "",
        landmark: user.defaultAddress.landmark || "",
        area: user.defaultAddress.area || "",
        city: user.defaultAddress.city || "",
        state: user.defaultAddress.state || "Maharashtra",
        pincode: user.defaultAddress.pincode || "",
      });
      setUseSavedAddress(true);
    } else {
      setUseSavedAddress(false);
      setForm({
        fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        phone: user?.phone || "",
        addressLine1: "",
        addressLine2: "",
        landmark: "",
        area: "",
        city: "",
        state: "Maharashtra",
        pincode: "",
      });
    }
  }, [user]);

  // Refresh cart on mount (skip for Buy Now)
  useEffect(() => {
    if (!isBuyNow) {
      refreshCartWithLatestData();
    }
  }, [isBuyNow]);

  // ✅ Load Razorpay script on component mount
  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        console.log("[PAYMENT] Razorpay already loaded");
        setRazorpayLoaded(true);
        setRazorpayLoadAttempted(true);
        return;
      }

      if (razorpayLoading) return;

      setRazorpayLoading(true);
      setRazorpayLoadAttempted(true);
      console.log("[PAYMENT] Loading Razorpay script...");

      try {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.id = "razorpay-script";

        const existingScript = document.getElementById("razorpay-script");
        if (existingScript) {
          console.log(
            "[PAYMENT] Razorpay script already exists, waiting for load...",
          );
          await new Promise((resolve) => {
            if (window.Razorpay) {
              resolve(true);
              return;
            }
            existingScript.onload = () => {
              console.log("[PAYMENT] Existing Razorpay script loaded");
              resolve(true);
            };
          });
          setRazorpayLoaded(true);
          setRazorpayLoading(false);
          return;
        }

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("[PAYMENT] Razorpay script loaded successfully");
            setTimeout(() => {
              resolve(true);
            }, 500);
          };
          script.onerror = () => {
            console.error("[PAYMENT] Failed to load Razorpay script");
            reject(new Error("Failed to load Razorpay script"));
          };
          document.body.appendChild(script);
        });

        let attempts = 0;
        while (!window.Razorpay && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          attempts++;
        }

        if (window.Razorpay) {
          console.log("[PAYMENT] window.Razorpay is available");
          setRazorpayLoaded(true);
        } else {
          console.error(
            "[PAYMENT] window.Razorpay not available after loading",
          );
          setRazorpayLoaded(false);
        }
      } catch (error) {
        console.error("[PAYMENT] Razorpay loading error:", error);
        setRazorpayLoaded(false);
      } finally {
        setRazorpayLoading(false);
      }
    };

    loadRazorpay();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ Get the correct cart total
  const effectiveCartTotal = isBuyNow ? buyNowCartTotal : cartTotal;
  const effectiveItems = isBuyNow ? buyNowItems : cart.items;

  const shippingCost = effectiveCartTotal >= 999 ? 0 : 99;

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    let discountBase = effectiveCartTotal;
    if (appliedCoupon.discountOn === "delivery") discountBase = shippingCost;
    let discount = 0;
    if (appliedCoupon.discountType === "percentage") {
      discount = (discountBase * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount)
        discount = Math.min(discount, appliedCoupon.maxDiscount);
    } else {
      discount = Math.min(appliedCoupon.discountValue, discountBase);
    }
    return Math.round(discount * 100) / 100;
  };

  const couponDiscount = calculateCouponDiscount();
  const couponCodeApplied = appliedCoupon?.code || "";
  const grandTotal = Math.max(
    0,
    effectiveCartTotal - couponDiscount + shippingCost,
  );

  const advanceAmount = Math.round(grandTotal * 0.1);
  const remainingCOD = grandTotal - advanceAmount;

  // Handle coupon application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const { data } = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponCode.trim(),
        cartTotal: effectiveCartTotal,
      });
      if (data.success) {
        applyCoupon({
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discountOn: data.coupon.discountOn || "total",
          maxDiscount: data.coupon.maxDiscount || null,
        });
        setCouponCode("");
        toast.success(`Coupon "${data.coupon.code}" applied!`);
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError("");
    toast.success("Coupon removed");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  const refreshUserData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      if (data.user) {
        updateProfile(data.user);
      }
    } catch (error) {
      console.log("Failed to refresh user data");
    }
  };

  const saveAddressToUserProfile = async (addressData) => {
    try {
      await axios.post(`${API_URL}/users/address`, addressData);
      await refreshUserData();
      return true;
    } catch (error) {
      console.log("Failed to save address:", error.message);
      return false;
    }
  };

  const buildOrderItems = () => {
    // If in Buy Now mode, use the buyNowItem
    if (isBuyNow && buyNowItem) {
      return [
        {
          product: buyNowItem.productId,
          name: buyNowItem.name,
          image: buyNowItem.image || buyNowItem.product?.images?.[0]?.url || "",
          price: buyNowItem.price,
          quantity: buyNowItem.quantity,
          subtotal: buyNowItem.price * buyNowItem.quantity,
          variant: buyNowItem.variant || null,
        },
      ];
    }

    return cart.items
      .map((item) => {
        const product = item.product;
        if (!product) return null;

        const price = item.price || product.comparePrice || product.price || 0;
        const variant = item.variant;

        // ✅ Get variant image if available, otherwise use product image
        let variantImage = "";
        if (variant && variant.images && variant.images.length > 0) {
          variantImage = variant.images[0]?.url || "";
        }
        // If variant has no images, check if the variant object has a direct image field
        if (!variantImage && variant && variant.image) {
          variantImage = variant.image;
        }
        // Fallback to product image
        if (!variantImage) {
          variantImage = product.images?.[0]?.url || "";
        }

        return {
          product: product._id,
          name: product.name,
          image: variantImage,
          price: price,
          quantity: item.quantity,
          subtotal: price * item.quantity,
          variant: variant
            ? {
                name: variant.name || "",
                sku: variant.sku || "",
                price: variant.price || price,
                color: variant.color
                  ? {
                      _id: variant.color._id || null,
                      name: variant.color.name || "",
                      hexCode: variant.color.hexCode || "",
                    }
                  : null,
                attributes: variant.attributes || {},
                // ✅ Store variant images for display
                images: variant.images || [],
              }
            : null,
        };
      })
      .filter(Boolean);
  };

  // Handle zero amount payment (free orders)
  const handleZeroAmountOrder = async (orderItems) => {
    try {
      const orderData = {
        shippingAddress: form,
        couponCode: couponCodeApplied || undefined,
        paymentMethod: "online",
        paymentStatus: "paid",
        isCOD: false,
        orderStatus: "confirmed",
        items: orderItems,
      };

      const { data } = await axios.post(`${API_URL}/orders`, orderData);

      if (isBuyNow) {
        setIsBuyNow(false);
        setBuyNowItem(null);
        setBuyNowItems([]);
        setBuyNowCartTotal(0);
      } else {
        await clearCart();
      }

      toast.success("Order placed successfully! 🎉");
      navigate(`/account/orders/${data.order._id}`);
      return true;
    } catch (error) {
      console.error("Zero amount order error:", error);
      toast.error(error.response?.data?.message || "Failed to create order");
      return false;
    }
  };

  // ✅ Helper function to open Razorpay
  const openRazorpay = (options) => {
    console.log("[PAYMENT] Opening Razorpay...");
    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
      console.log("[PAYMENT] Razorpay opened successfully");
      return true;
    } catch (error) {
      console.error("[PAYMENT] Failed to open Razorpay:", error);
      toast.error("Failed to open payment window. Please try again.");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("[PAYMENT] Checkout submitted");
    console.log("[PAYMENT] Payment method:", paymentMethod);
    console.log("[PAYMENT] Grand total:", grandTotal);
    console.log("[PAYMENT] Is Buy Now:", isBuyNow);
    console.log("[PAYMENT] Razorpay loaded:", razorpayLoaded);
    console.log("[PAYMENT] window.Razorpay exists:", !!window.Razorpay);

    if (hasDeactivatedProducts && !isBuyNow) {
      toast.error(
        "Your cart contains deactivated products. Please remove them to proceed.",
      );
      return;
    }

    if (
      !form.fullName ||
      !form.phone ||
      !form.addressLine1 ||
      !form.city ||
      !form.pincode
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (user && saveAddressToProfile && !useSavedAddress) {
      const addressExists = user.addresses?.some(
        (addr) =>
          addr.addressLine1 === form.addressLine1 &&
          addr.city === form.city &&
          addr.pincode === form.pincode,
      );

      if (!addressExists) {
        const addressData = {
          name: "Home",
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2 || "",
          landmark: form.landmark || "",
          area: form.area || "",
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          isDefault: user.addresses?.length === 0,
        };
        await saveAddressToUserProfile(addressData);
      }
    }

    const orderItems = buildOrderItems();

    if (orderItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Handle zero amount orders
    if (grandTotal === 0) {
      setLoading(true);
      await handleZeroAmountOrder(orderItems);
      setLoading(false);
      return;
    }

    // ✅ Check if Razorpay is loaded before proceeding
    if (!razorpayLoaded && !window.Razorpay) {
      toast.error("Payment gateway is still loading. Please wait a moment...");
      return;
    }

    if (paymentMethod === "online") {
      setLoading(true);
      try {
        console.log("[PAYMENT] Online payment flow started");

        const orderData = {
          shippingAddress: form,
          couponCode: couponCodeApplied || undefined,
          paymentMethod: "online",
          paymentStatus: "pending",
          isCOD: false,
          orderStatus: "pending",
          items: orderItems,
        };

        console.log("[PAYMENT] Creating pending order...");
        const { data: orderResponse } = await axios.post(
          `${API_URL}/orders`,
          orderData,
        );

        const createdOrder = orderResponse.order;
        console.log(
          "[PAYMENT] Pending order created:",
          createdOrder.orderNumber,
        );

        console.log("[PAYMENT] Creating Razorpay order...");
        const { data: razorpayData } = await axios.post(
          `${API_URL}/payment/create-order`,
          { orderId: createdOrder._id },
        );

        console.log(
          "[PAYMENT] Razorpay order created:",
          razorpayData.razorpayOrderId,
        );
        console.log("[PAYMENT] Razorpay amount:", razorpayData.amount);

        setProcessingPayment(true);

        const razorpayKey = razorpayData.key || RAZORPAY_KEY;

        const options = {
          key: razorpayKey,
          amount: razorpayData.amount,
          currency: "INR",
          name: "Spexxo",
          description: `Order ${createdOrder.orderNumber}`,
          order_id: razorpayData.razorpayOrderId,
          prefill: {
            name:
              form.fullName ||
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "Customer",
            email: user?.email || "customer@spexxo.com",
            contact: form.phone || user?.phone || "9999999999",
          },
          theme: { color: "#3D96EB" },
          modal: {
            ondismiss: function () {
              console.log(
                "[PAYMENT] Razorpay modal dismissed - payment cancelled",
              );
              setProcessingPayment(false);
              setLoading(false);
              toast.error("Payment cancelled");
              axios
                .delete(`${API_URL}/orders/${createdOrder._id}/cancel-pending`)
                .then(() => {
                  console.log("[PAYMENT] Pending order deleted");
                })
                .catch((err) => {
                  console.error(
                    "[PAYMENT] Failed to delete pending order:",
                    err,
                  );
                });
            },
          },
          handler: async function (response) {
            console.log("[PAYMENT] Razorpay payment handler called");
            try {
              setProcessingPayment(false);

              const verifyData = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createdOrder._id,
              };

              console.log("[PAYMENT] Verifying payment...");
              const { data } = await axios.post(
                `${API_URL}/payment/verify`,
                verifyData,
              );

              // ✅ Clear Buy Now state if applicable
              if (isBuyNow) {
                setIsBuyNow(false);
                setBuyNowItem(null);
                setBuyNowItems([]);
                setBuyNowCartTotal(0);
              } else {
                await clearCart();
              }

              toast.success("Payment successful! Order placed! 🎉");
              console.log("[PAYMENT] Order verified and confirmed");
              navigate(`/account/orders/${data.order._id}`);
            } catch (error) {
              console.error("[PAYMENT] Order verification error:", error);

              try {
                await axios.delete(
                  `${API_URL}/orders/${createdOrder._id}/cancel-pending`,
                );
                console.log(
                  "[PAYMENT] Pending order deleted due to payment failure",
                );
              } catch (deleteError) {
                console.error(
                  "[PAYMENT] Failed to delete pending order:",
                  deleteError,
                );
              }

              toast.error(
                error.response?.data?.message ||
                  "Payment verification failed. Please contact support.",
              );
              navigate("/");
            }
          },
        };

        console.log("[PAYMENT] Opening Razorpay...");
        const rzp = new window.Razorpay(options);
        rzp.open();
        console.log("[PAYMENT] Razorpay opened successfully");
      } catch (error) {
        console.error("[PAYMENT] Payment initiation error:", error);
        toast.error(
          error.response?.data?.message ||
            "Payment initiation failed. Please try again.",
        );
        setProcessingPayment(false);
      } finally {
        setLoading(false);
      }
    } else {
      // COD Payment
      setLoading(true);
      try {
        console.log("[PAYMENT] COD payment flow started");

        if (advanceAmount > 0) {
          const orderData = {
            shippingAddress: form,
            couponCode: couponCodeApplied || undefined,
            paymentMethod: "cod",
            paymentStatus: "pending",
            isCOD: true,
            orderStatus: "pending",
            codAdvance: advanceAmount,
            remainingCOD: remainingCOD,
            items: orderItems,
          };

          console.log("[PAYMENT] Creating pending COD order with advance...");
          const { data: orderResponse } = await axios.post(
            `${API_URL}/orders`,
            orderData,
          );
          const createdOrder = orderResponse.order;
          console.log(
            "[PAYMENT] Pending COD order created:",
            createdOrder.orderNumber,
          );

          console.log("[PAYMENT] Creating Razorpay order for advance...");
          const { data: razorpayData } = await axios.post(
            `${API_URL}/payment/create-order`,
            { orderId: createdOrder._id },
          );
          console.log(
            "[PAYMENT] Razorpay order created:",
            razorpayData.razorpayOrderId,
          );

          setProcessingPayment(true);

          const razorpayKey = razorpayData.key || RAZORPAY_KEY;

          const options = {
            key: razorpayKey,
            amount: razorpayData.amount,
            currency: "INR",
            name: "Spexxo",
            description: `10% Advance - Order ${createdOrder.orderNumber}`,
            order_id: razorpayData.razorpayOrderId,
            prefill: {
              name:
                form.fullName ||
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "Customer",
              email: user?.email || "customer@spexxo.com",
              contact: form.phone || user?.phone || "9999999999",
            },
            theme: { color: "#3D96EB" },
            modal: {
              ondismiss: function () {
                console.log(
                  "[PAYMENT] Razorpay modal dismissed - payment cancelled",
                );
                setProcessingPayment(false);
                setLoading(false);
                toast.error("Advance payment cancelled");
                axios
                  .delete(
                    `${API_URL}/orders/${createdOrder._id}/cancel-pending`,
                  )
                  .then(() => {
                    console.log("[PAYMENT] Pending order deleted");
                  })
                  .catch((err) => {
                    console.error(
                      "[PAYMENT] Failed to delete pending order:",
                      err,
                    );
                  });
              },
            },
            handler: async function (response) {
              console.log("[PAYMENT] Razorpay COD advance handler called");
              try {
                setProcessingPayment(false);

                await axios.post(`${API_URL}/payment/verify-cod-advance`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: createdOrder._id,
                  isCODAdvance: true,
                });

                // ✅ Clear Buy Now state if applicable
                if (isBuyNow) {
                  setIsBuyNow(false);
                  setBuyNowItem(null);
                  setBuyNowItems([]);
                  setBuyNowCartTotal(0);
                } else {
                  await clearCart();
                }

                toast.success(
                  "Order placed with 10% advance! Remaining ₹" +
                    remainingCOD.toLocaleString() +
                    " on delivery.",
                );
                console.log("[PAYMENT] COD advance verified and completed");

                const { data: orderData } = await axios.get(
                  `${API_URL}/orders/${createdOrder._id}`,
                );
                navigate(`/account/orders/${orderData.order._id}`);
              } catch (error) {
                console.error("[PAYMENT] COD order creation error:", error);
                try {
                  await axios.delete(
                    `${API_URL}/orders/${createdOrder._id}/cancel-pending`,
                  );
                } catch (deleteError) {
                  console.error(
                    "[PAYMENT] Failed to delete pending order:",
                    deleteError,
                  );
                }
                toast.error("Order creation failed after advance payment.");
                navigate("/");
              }
            },
          };

          console.log("[PAYMENT] Opening Razorpay for COD advance...");
          const rzp = new window.Razorpay(options);
          rzp.open();
          console.log("[PAYMENT] Razorpay opened for COD advance");
        } else {
          console.log("[PAYMENT] Creating COD order without advance...");
          const orderData = {
            shippingAddress: form,
            couponCode: couponCodeApplied || undefined,
            paymentMethod: "cod",
            paymentStatus: "pending",
            isCOD: true,
            orderStatus: "pending",
            items: orderItems,
          };

          const { data } = await axios.post(`${API_URL}/orders`, orderData);

          if (isBuyNow) {
            setIsBuyNow(false);
            setBuyNowItem(null);
            setBuyNowItems([]);
            setBuyNowCartTotal(0);
          } else {
            await clearCart();
          }

          toast.success("Order placed successfully!");
          console.log("[PAYMENT] COD order completed");
          navigate(`/account/orders/${data.order._id}`);
        }
      } catch (error) {
        console.error("[PAYMENT] COD order error:", error);
        toast.error(error.response?.data?.message || "Failed to create order");
        setProcessingPayment(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddressSubmit = (data) => {
    setForm(data);
    if (user && saveAddressToProfile) {
      // Save to profile logic here
    }
  };

  if (!effectiveItems?.length && !isBuyNow) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-text mb-2">Cart is Empty</h2>
          <p className="text-text-light mb-6">
            {isBuyNow
              ? "No product selected"
              : "Add some products before checking out"}
          </p>
          <Link to="/shop" className="btn-primary">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Checkout" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-8">
            {isBuyNow ? "Buy Now" : "Checkout"}
          </h1>

          {/* Buy Now Banner */}
          {isBuyNow && buyNowItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={buyNowItem.image || "https://picsum.photos/100/100"}
                    alt={buyNowItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-text">Buying Now:</p>
                  <p className="text-sm text-text">
                    {buyNowItem.name} × {buyNowItem.quantity}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    ₹{buyNowItem.price?.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsBuyNow(false);
                    setBuyNowItem(null);
                    setBuyNowItems([]);
                    setBuyNowCartTotal(0);
                    navigate("/shop");
                  }}
                  className="ml-auto text-sm text-red-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Deactivated Products Warning */}
          {hasDeactivatedProducts && !isBuyNow && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">
                    Deactivated Products in Cart
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Your cart contains products that have been deactivated.
                    Please remove them to proceed with checkout.
                  </p>
                  <Link
                    to="/cart"
                    className="text-sm text-red-700 font-medium hover:underline mt-2 inline-block"
                  >
                    Go to Cart →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-primary" /> Shipping Address
              </h2>

              {user?.addresses?.length > 0 && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowAddressList(!showAddressList)}
                    className="w-full text-left p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {showAddressList
                          ? "Hide saved addresses"
                          : "Select from saved addresses"}
                      </span>
                    </div>
                    <span className="text-xs text-text-light">
                      {user.addresses.length} addresses
                    </span>
                  </button>

                  {showAddressList && (
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {user.addresses.map((addr) => (
                        <button
                          key={addr._id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(addr._id);
                            setForm({
                              fullName: addr.fullName || "",
                              phone: addr.phone || "",
                              addressLine1: addr.addressLine1 || "",
                              addressLine2: addr.addressLine2 || "",
                              landmark: addr.landmark || "",
                              area: addr.area || "",
                              city: addr.city || "",
                              state: addr.state || "Maharashtra",
                              pincode: addr.pincode || "",
                            });
                            setUseSavedAddress(true);
                            setShowAddressList(false);
                          }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition ${
                            selectedAddressId === addr._id
                              ? "border-primary bg-[#EBF4FC]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {addr.name === "Home" ? (
                              <HomeIcon className="w-4 h-4 text-gray-500" />
                            ) : addr.name === "Work" ? (
                              <BriefcaseIcon className="w-4 h-4 text-gray-500" />
                            ) : (
                              <MapPinIcon className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="font-medium text-sm">
                              {addr.name || "Address"}
                            </span>
                            {addr.isDefault && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-light mt-1">
                            {addr.addressLine1}
                            {addr.addressLine2 && `, ${addr.addressLine2}`}
                            {addr.area && `, ${addr.area}`}
                            {addr.city && `, ${addr.city}`}
                            {addr.state && `, ${addr.state}`}
                            {addr.pincode && ` - ${addr.pincode}`}
                          </p>
                          <p className="text-xs text-text-light mt-0.5">
                            📞 {addr.phone}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 mb-6">
                <AddressForm
                  initialData={form}
                  onSubmit={(data) => {
                    setForm(data);
                    toast.success("Address updated");
                  }}
                  isEditing={false}
                  showTypeSelector={false}
                  showSaveToProfile={!!user}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h3 className="font-semibold text-text mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                      paymentMethod === "cod"
                        ? "border-primary bg-[#EBF4FC]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-0.5 text-primary"
                    />
                    <div>
                      <p className="font-medium text-text">Cash on Delivery</p>
                      <p className="text-xs text-text-light">
                        Pay 10% advance now, remaining on delivery
                      </p>
                    </div>
                  </label>

                  {paymentMethod === "cod" && grandTotal > 0 && (
                    <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          i
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            10% Advance Payment Required
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Pay ₹{advanceAmount.toLocaleString()} now to confirm
                            your order. Remaining ₹
                            {remainingCOD.toLocaleString()} on delivery.
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            ✅ This helps us ensure your order reaches you
                            reliably
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                      paymentMethod === "online"
                        ? "border-primary bg-[#EBF4FC]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="mt-0.5 text-primary"
                    />
                    <div>
                      <p className="font-medium text-text">Online Payment</p>
                      <p className="text-xs text-text-light">
                        Pay full amount securely via UPI, Cards, NetBanking,
                        Wallets
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {grandTotal === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">
                        Free Order! 🎉
                      </p>
                      <p className="text-sm text-green-600">
                        Your total is ₹0. No payment required. Click "Place
                        Order" to confirm.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {razorpayLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5"></div>
                    <div>
                      <p className="font-medium text-blue-700">
                        Loading Payment Gateway...
                      </p>
                      <p className="text-sm text-blue-600">
                        Please wait, the payment system is initializing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  loading || processingPayment || hasDeactivatedProducts
                }
                className={`w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasDeactivatedProducts ? "bg-gray-400 hover:bg-gray-400" : ""
                }`}
              >
                {hasDeactivatedProducts
                  ? "Remove deactivated items to proceed"
                  : loading && !processingPayment
                    ? "Creating Order..."
                    : processingPayment
                      ? "Complete Payment in Popup..."
                      : grandTotal === 0
                        ? "Place Order (Free) 🎉"
                        : paymentMethod === "online"
                          ? `Pay ₹${grandTotal.toLocaleString()} Online`
                          : `Pay ₹${advanceAmount.toLocaleString()} Advance (10% of ₹${grandTotal.toLocaleString()})`}
              </button>
              {hasDeactivatedProducts && (
                <p className="text-red-500 text-sm text-center mt-2">
                  ⚠️ Your cart contains deactivated products. Please remove them
                  to proceed.
                </p>
              )}
              {paymentMethod === "cod" &&
                !processingPayment &&
                !loading &&
                !hasDeactivatedProducts &&
                grandTotal > 0 && (
                  <p className="text-xs text-text-light text-center mt-2">
                    You'll pay remaining ₹{remainingCOD.toLocaleString()} on
                    delivery
                  </p>
                )}
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">
                  {isBuyNow ? "Order Summary" : "Order Summary"}
                </h2>

                {/* Coupon Section */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm font-medium text-text mb-2 flex items-center gap-1">
                    <TicketIcon className="w-4 h-4" /> Apply Coupon
                  </p>
                  {appliedCoupon ? (
                    <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-700">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.discountType === "percentage"
                              ? `${appliedCoupon.discountValue}% off${appliedCoupon.maxDiscount ? ` (max ₹${appliedCoupon.maxDiscount})` : ""}`
                              : `₹${appliedCoupon.discountValue} off`}
                            <span className="text-green-500 ml-1">
                              on{" "}
                              {appliedCoupon.discountOn === "delivery"
                                ? "delivery"
                                : appliedCoupon.discountOn === "product"
                                  ? "products"
                                  : "total"}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-500 hover:text-red-500 transition"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:border-primary"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                        >
                          {validatingCoupon ? "..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 mt-1">
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {effectiveItems.map((item, index) => {
                    const name = isBuyNow
                      ? item.name
                      : item.product?.name || item.name || "Product";
                    const variantName = isBuyNow
                      ? item.variant?.name || ""
                      : item.variant?.name || "";
                    const price = isBuyNow
                      ? item.price
                      : item.price ||
                        item.product?.comparePrice ||
                        item.product?.price ||
                        0;
                    const quantity = isBuyNow
                      ? item.quantity
                      : item.quantity || 1;
                    const isDeactivated = isBuyNow
                      ? false
                      : item.product?.isActive === false;

                    return (
                      <div
                        key={isBuyNow ? `buynow-${index}` : item._id}
                        className={`flex justify-between text-sm py-2 border-b border-gray-50 ${isDeactivated ? "opacity-50" : ""}`}
                      >
                        <span className="truncate mr-2">
                          {isDeactivated && "⚠️ "}
                          {name}
                          {variantName && (
                            <span className="text-xs text-primary ml-1">
                              ({variantName})
                            </span>
                          )}
                          × {quantity}
                        </span>
                        <span className="flex-shrink-0">
                          ₹{(price * quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{effectiveCartTotal.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {couponCodeApplied ? ` (${couponCodeApplied})` : ""}
                      </span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span
                      className={shippingCost === 0 ? "text-green-600" : ""}
                    >
                      {shippingCost === 0 ? "FREE" : `₹${shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                  {grandTotal === 0 && (
                    <p className="text-xs text-green-600 text-center font-medium">
                      🎉 Free Order! No payment needed.
                    </p>
                  )}
                  {couponDiscount > 0 && grandTotal > 0 && (
                    <p className="text-xs text-green-600">
                      🎉 You saved ₹{couponDiscount.toLocaleString()}!
                    </p>
                  )}
                  {paymentMethod === "cod" &&
                    !hasDeactivatedProducts &&
                    grandTotal > 0 && (
                      <div className="bg-amber-50 p-3 rounded-lg mt-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-amber-800">
                            Pay Now (10%)
                          </span>
                          <span className="font-semibold text-amber-600">
                            ₹{advanceAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-amber-700">
                            Pay on Delivery
                          </span>
                          <span className="font-semibold text-amber-700">
                            ₹{remainingCOD.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-amber-600 mt-2 pt-2 border-t border-amber-200">
                          <span>Total</span>
                          <span>₹{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                </div>
                <Link
                  to={isBuyNow ? "/shop" : "/cart"}
                  className="block text-center text-primary text-sm mt-4 hover:underline"
                >
                  {isBuyNow ? "← Back to Shop" : "← Back to Cart"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
