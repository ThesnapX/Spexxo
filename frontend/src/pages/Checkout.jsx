// frontend/src/pages/Checkout.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  MapPinIcon,
  CheckCircleIcon,
  HomeIcon,
  BriefcaseIcon,
  ExclamationCircleIcon,
  TicketIcon,
  XCircleIcon,
  TruckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { trackInitiateCheckout, trackPurchase } from "../utils/metaPixel";
import AddressForm from "../components/common/AddressForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const Checkout = () => {
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

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Razorpay loading
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Shipping
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [isPincodeValid, setIsPincodeValid] = useState(false);
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [shippingError, setShippingError] = useState("");

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

  // ─────────────────────────────────────────────
  // ✅ Hard submission lock.
  // useRef is synchronous, unlike setState — this is the ONLY reliable
  // way to block rapid double-clicks before React re-renders the button.
  // ─────────────────────────────────────────────
  const submittingRef = useRef(false);

  // ✅ Idempotency key — regenerated per checkout attempt.
  // Preserved across network retries within a single attempt.
  const idempotencyKeyRef = useRef(null);

  // ─────────────────────────────────────────────
  // Buy Now bootstrap
  // ─────────────────────────────────────────────
  useEffect(() => {
    const buyNowData = sessionStorage.getItem("buyNowItem");
    if (buyNowData) {
      try {
        const item = JSON.parse(buyNowData);
        setBuyNowItem(item);
        setIsBuyNow(true);
        setBuyNowItems([item]);
        setBuyNowCartTotal(item.price * item.quantity);
        sessionStorage.removeItem("buyNowItem");
      } catch (e) {
        console.error("[CHECKOUT] Failed to parse buyNowItem:", e);
      }
    }
  }, []);

  // ─────────────────────────────────────────────
  // InitiateCheckout — fires exactly once per checkout session.
  // ─────────────────────────────────────────────
  const initiateCheckoutFiredRef = useRef(false);

  useEffect(() => {
    if (initiateCheckoutFiredRef.current) return;

    let items = [];
    let value = 0;
    let sessionKey = "";

    if (isBuyNow && buyNowItems.length > 0) {
      items = buyNowItems.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        price: it.price,
      }));
      value = buyNowCartTotal;
      sessionKey = `ic_buynow_${items[0].productId}_${items[0].quantity}`;
    } else if (cart?.items?.length > 0) {
      if (loading) return;
      const activeItems = cart.items.filter(
        (it) => it.product && it.product.isActive !== false,
      );
      if (activeItems.length === 0) return;
      items = activeItems.map((it) => ({
        productId: it.product._id,
        quantity: it.quantity,
        price:
          safeNumber(it.price) ||
          safeNumber(it.product.comparePrice) ||
          safeNumber(it.product.price),
      }));
      value = cartTotal;
      sessionKey = `ic_cart_${items
        .map((i) => `${i.productId}x${i.quantity}`)
        .sort()
        .join("_")}`;
    } else {
      return;
    }

    if (items.length === 0 || value <= 0) return;

    const alreadyFired = sessionStorage.getItem(sessionKey);
    if (alreadyFired) {
      initiateCheckoutFiredRef.current = true;
      return;
    }

    initiateCheckoutFiredRef.current = true;
    sessionStorage.setItem(sessionKey, "1");

    trackInitiateCheckout({
      items,
      value,
      numItems: items.reduce((s, it) => s + (it.quantity || 1), 0),
    }).catch(() => {});
  }, [isBuyNow, buyNowItems, buyNowCartTotal, cart, cartTotal, loading]);

  // ─────────────────────────────────────────────
  // Shipping options
  // ─────────────────────────────────────────────
  const fetchShippingOptions = useCallback(
    async (pincode) => {
      if (!pincode || pincode.length !== 6) {
        setShippingOptions([]);
        setSelectedShipping(null);
        setIsPincodeValid(false);
        setPincodeChecked(false);
        return;
      }

      setShippingLoading(true);
      setShippingError("");
      setPincodeChecked(false);

      try {
        const items = isBuyNow ? buyNowItems : cart.items;
        const { data } = await axios.post(`${API_URL}/shipping/options`, {
          pincode,
          items,
        });

        if (data.success && data.isServiceable && data.options?.length > 0) {
          setShippingOptions(data.options);
          setIsPincodeValid(true);
          setPincodeChecked(true);
          if (
            !selectedShipping ||
            !data.options.some((o) => o.id === selectedShipping?.id)
          ) {
            setSelectedShipping(data.options[0]);
          }
          toast.success(`Shipping available for pincode ${pincode}`);
        } else {
          setShippingOptions([]);
          setIsPincodeValid(false);
          setPincodeChecked(true);
          setShippingError("We don't deliver to this pincode yet");
          toast.error("We don't deliver to this pincode yet");
        }
      } catch (error) {
        console.error("Failed to fetch shipping options:", error.message);
        setShippingOptions([]);
        setIsPincodeValid(false);
        setPincodeChecked(true);
        setShippingError("Failed to check shipping availability");
        toast.error("Failed to check shipping availability");
      } finally {
        setShippingLoading(false);
      }
    },
    [isBuyNow, buyNowItems, cart.items, selectedShipping],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.pincode && form.pincode.length === 6) {
        fetchShippingOptions(form.pincode);
      } else {
        setShippingOptions([]);
        setSelectedShipping(null);
        setIsPincodeValid(false);
        setPincodeChecked(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.pincode, fetchShippingOptions]);

  // ─────────────────────────────────────────────
  // Load default address
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultAddr =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];
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

  // Refresh cart (skip for Buy Now)
  useEffect(() => {
    if (!isBuyNow) refreshCartWithLatestData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuyNow]);

  // ─────────────────────────────────────────────
  // Razorpay script
  // ─────────────────────────────────────────────
  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }
      if (razorpayLoading) return;
      setRazorpayLoading(true);

      try {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.id = "razorpay-script";
        const existing = document.getElementById("razorpay-script");

        if (existing) {
          await new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            existing.onload = () => resolve(true);
          });
          setRazorpayLoaded(true);
          return;
        }

        await new Promise((resolve, reject) => {
          script.onload = () => setTimeout(() => resolve(true), 500);
          script.onerror = () =>
            reject(new Error("Failed to load Razorpay script"));
          document.body.appendChild(script);
        });

        let attempts = 0;
        while (!window.Razorpay && attempts < 20) {
          await new Promise((r) => setTimeout(r, 200));
          attempts++;
        }
        setRazorpayLoaded(!!window.Razorpay);
      } catch (error) {
        console.error("[PAYMENT] Razorpay loading error:", error.message);
        setRazorpayLoaded(false);
      } finally {
        setRazorpayLoading(false);
      }
    };
    loadRazorpay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  // Totals — display only. Backend recomputes.
  // ─────────────────────────────────────────────
  const effectiveCartTotal = isBuyNow ? buyNowCartTotal : cartTotal;
  const effectiveItems = isBuyNow ? buyNowItems : cart.items;

  const getShippingCost = () => {
    if (selectedShipping && isPincodeValid)
      return safeNumber(selectedShipping.price);
    if (shippingOptions.length > 0) return safeNumber(shippingOptions[0].price);
    return 99;
  };
  const shippingCost = getShippingCost();

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    let discountBase = effectiveCartTotal;
    if (appliedCoupon.discountOn === "delivery") discountBase = shippingCost;
    let discount = 0;
    if (appliedCoupon.discountType === "percentage") {
      discount = (discountBase * safeNumber(appliedCoupon.discountValue)) / 100;
      if (appliedCoupon.maxDiscount)
        discount = Math.min(discount, safeNumber(appliedCoupon.maxDiscount));
    } else {
      discount = Math.min(
        safeNumber(appliedCoupon.discountValue),
        discountBase,
      );
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

  const hasDeactivatedProducts =
    !isBuyNow && cart.items.some((item) => item.product?.isActive === false);

  // ─────────────────────────────────────────────
  // Coupon handlers
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Address save
  // ─────────────────────────────────────────────
  const refreshUserData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      if (data.user) updateProfile(data.user);
    } catch {
      /* silent */
    }
  };

  const saveAddressToUserProfile = async (addressData) => {
    try {
      await axios.post(`${API_URL}/users/address`, addressData);
      await refreshUserData();
      return true;
    } catch {
      return false;
    }
  };

  // ─────────────────────────────────────────────
  // Build order items — only IDs + qty go to backend.
  // Prices are recalculated by the backend.
  // ─────────────────────────────────────────────
  const buildOrderItems = () => {
    if (isBuyNow && buyNowItem) {
      return [
        {
          product: buyNowItem.productId,
          quantity: buyNowItem.quantity,
          variant: buyNowItem.variant
            ? {
                _id: buyNowItem.variant._id || null,
                name: buyNowItem.variant.name || "",
                sku: buyNowItem.variant.sku || "",
                price: safeNumber(buyNowItem.variant.price),
              }
            : null,
        },
      ];
    }

    return cart.items
      .map((item) => {
        const product = item.product;
        if (!product) return null;
        return {
          product: product._id,
          quantity: item.quantity,
          variant: item.variant
            ? {
                _id: item.variant._id || null,
                name: item.variant.name || "",
                sku: item.variant.sku || "",
                price: safeNumber(item.variant.price),
              }
            : null,
        };
      })
      .filter(Boolean);
  };

  // ─────────────────────────────────────────────
  // Pre-submit validation
  // ─────────────────────────────────────────────
  const validateBeforeSubmit = () => {
    if (hasDeactivatedProducts && !isBuyNow) {
      toast.error(
        "Your cart contains deactivated products. Please remove them to proceed.",
      );
      return false;
    }
    if (
      !form.fullName ||
      !form.phone ||
      !form.addressLine1 ||
      !form.city ||
      !form.pincode
    ) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (!/^[0-9]{6}$/.test(form.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return false;
    }
    if (!isPincodeValid || shippingOptions.length === 0) {
      toast.error("Please enter a valid pincode for shipping");
      return false;
    }
    if (!Number.isFinite(grandTotal) || grandTotal < 0) {
      toast.error("Order total is invalid. Please refresh and try again.");
      return false;
    }
    if (
      paymentMethod === "online" &&
      grandTotal > 0 &&
      !razorpayLoaded &&
      !window.Razorpay
    ) {
      toast.error("Payment gateway is still loading. Please wait a moment...");
      return false;
    }
    const orderItems = buildOrderItems();
    if (orderItems.length === 0) {
      toast.error("Your cart is empty");
      return false;
    }
    return true;
  };

  // ─────────────────────────────────────────────
  // Main submit
  // ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // ✅ Synchronous lock — the ONLY reliable double-click guard.
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;

    try {
      if (!validateBeforeSubmit()) {
        return;
      }

      // Save address to profile if requested
      if (user && saveAddressToProfile && !useSavedAddress) {
        const addressExists = user.addresses?.some(
          (addr) =>
            addr.addressLine1 === form.addressLine1 &&
            addr.city === form.city &&
            addr.pincode === form.pincode,
        );
        if (!addressExists) {
          await saveAddressToUserProfile({
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
          });
        }
      }

      const orderItems = buildOrderItems();

      // Fresh idempotency key per attempt.
      idempotencyKeyRef.current = `ord_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`;

      // ── Zero-value order → instant confirm, no Razorpay ──
      if (grandTotal === 0) {
        setLoading(true);
        const orderData = {
          shippingAddress: form,
          couponCode: couponCodeApplied || undefined,
          paymentMethod: "online",
          isCOD: false,
          items: orderItems,
          shippingMethod: selectedShipping?.id || "basic",
          shippingMethodName: selectedShipping?.name || "Basic Shipping",
          shippingCost,
          shippingDelivery: selectedShipping?.delivery || "3-7 business days",
          pincode: form.pincode,
          idempotencyKey: idempotencyKeyRef.current,
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
        if (data.order) trackPurchase(data.order, user).catch(() => {});
        toast.success("Order placed successfully! 🎉");
        navigate(`/account/orders/${data.order._id}`);
        return;
      }

      // ── Online payment ──
      if (paymentMethod === "online") {
        setLoading(true);
        const orderData = {
          shippingAddress: form,
          couponCode: couponCodeApplied || undefined,
          paymentMethod: "online",
          isCOD: false,
          items: orderItems,
          shippingMethod: selectedShipping?.id || "basic",
          shippingMethodName: selectedShipping?.name || "Basic Shipping",
          shippingCost,
          shippingDelivery: selectedShipping?.delivery || "3-7 business days",
          pincode: form.pincode,
          idempotencyKey: idempotencyKeyRef.current,
        };

        const { data: orderResponse } = await axios.post(
          `${API_URL}/orders`,
          orderData,
        );
        const createdOrder = orderResponse.order;

        const { data: razorpayData } = await axios.post(
          `${API_URL}/payment/create-order`,
          { orderId: createdOrder._id },
        );

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
              setProcessingPayment(false);
              submittingRef.current = false;
              toast.error("Payment cancelled");
              axios
                .delete(`${API_URL}/orders/${createdOrder._id}/cancel-pending`)
                .catch(() => {});
            },
          },
          handler: async function (response) {
            try {
              setProcessingPayment(false);
              const verifyData = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createdOrder._id,
              };
              const { data } = await axios.post(
                `${API_URL}/payment/verify`,
                verifyData,
              );
              if (isBuyNow) {
                setIsBuyNow(false);
                setBuyNowItem(null);
                setBuyNowItems([]);
                setBuyNowCartTotal(0);
              } else {
                await clearCart();
              }
              if (data.order) trackPurchase(data.order, user).catch(() => {});
              toast.success("Payment successful! Order placed! 🎉");
              navigate(`/account/orders/${data.order._id}`);
            } catch (error) {
              console.error("[PAYMENT] Verification error:", error.message);
              // Do NOT show "payment failed" — the payment may have
              // succeeded but verification failed. Send user to orders list
              // so they can see the true state.
              toast.error(
                "Payment verification is delayed. Please check My Orders in a moment.",
              );
              navigate("/account/orders");
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // ── COD ──
      setLoading(true);
      const advance = advanceAmount;
      const isCodNoAdvance = advance <= 0;

      const orderData = {
        shippingAddress: form,
        couponCode: couponCodeApplied || undefined,
        paymentMethod: "cod",
        isCOD: true,
        codAdvance: isCodNoAdvance ? 0 : advance,
        remainingCOD: isCodNoAdvance ? 0 : remainingCOD,
        items: orderItems,
        shippingMethod: selectedShipping?.id || "basic",
        shippingMethodName: selectedShipping?.name || "Basic Shipping",
        shippingCost,
        shippingDelivery: selectedShipping?.delivery || "3-7 business days",
        pincode: form.pincode,
        idempotencyKey: idempotencyKeyRef.current,
      };

      if (isCodNoAdvance) {
        // Instant confirm — backend fires Purchase + reduces stock.
        const { data } = await axios.post(`${API_URL}/orders`, orderData);
        if (isBuyNow) {
          setIsBuyNow(false);
          setBuyNowItem(null);
          setBuyNowItems([]);
          setBuyNowCartTotal(0);
        } else {
          await clearCart();
        }
        if (data.order) trackPurchase(data.order, user).catch(() => {});
        toast.success("Order placed successfully!");
        navigate(`/account/orders/${data.order._id}`);
        return;
      }

      // COD with 10% advance → Razorpay for the advance.
      const { data: orderResponse } = await axios.post(
        `${API_URL}/orders`,
        orderData,
      );
      const createdOrder = orderResponse.order;

      const { data: razorpayData } = await axios.post(
        `${API_URL}/payment/create-order`,
        { orderId: createdOrder._id },
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
            setProcessingPayment(false);
            submittingRef.current = false;
            toast.error("Advance payment cancelled");
            axios
              .delete(`${API_URL}/orders/${createdOrder._id}/cancel-pending`)
              .catch(() => {});
          },
        },
        handler: async function (response) {
          try {
            setProcessingPayment(false);
            const { data } = await axios.post(
              `${API_URL}/payment/verify-cod-advance`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createdOrder._id,
                isCODAdvance: true,
              },
            );
            if (isBuyNow) {
              setIsBuyNow(false);
              setBuyNowItem(null);
              setBuyNowItems([]);
              setBuyNowCartTotal(0);
            } else {
              await clearCart();
            }
            if (data.order) trackPurchase(data.order, user).catch(() => {});
            toast.success(
              "Order placed with 10% advance! Remaining ₹" +
                remainingCOD.toLocaleString() +
                " on delivery.",
            );
            navigate(`/account/orders/${data.order._id}`);
          } catch (error) {
            console.error(
              "[PAYMENT] COD advance verification error:",
              error.message,
            );
            toast.error(
              "Payment verification is delayed. Please check My Orders in a moment.",
            );
            navigate("/account/orders");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("[CHECKOUT] Submit error:", error.message);
      toast.error(
        error.response?.data?.message || "Checkout failed. Please try again.",
      );
    } finally {
      setLoading(false);
      // Note: we intentionally do NOT reset submittingRef here.
      // For payment flows, the Razorpay handler navigates away.
      // For COD-instant, we also navigate away.
      // On a caught error, the user stays on the page — and we want them
      // to be able to retry, so we reset the lock.
      // Detection: if we're still on /checkout after the try block,
      // reset the lock so retry works.
      // We use a microtask to check the current path is still /checkout.
      Promise.resolve().then(() => {
        if (window.location.pathname === "/checkout") {
          submittingRef.current = false;
        }
      });
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  if (!effectiveItems?.length && !isBuyNow) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-text mb-2">Cart is Empty</h2>
          <p className="text-text-light mb-6">
            Add some products before checking out
          </p>
          <Link to="/shop" className="btn-primary">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  const isSubmitDisabled =
    loading ||
    processingPayment ||
    hasDeactivatedProducts ||
    !isPincodeValid ||
    !form.pincode ||
    form.pincode.length !== 6;

  const submitLabel = (() => {
    if (hasDeactivatedProducts) return "Remove deactivated items to proceed";
    if (!form.pincode || form.pincode.length !== 6)
      return "Enter pincode to proceed";
    if (!isPincodeValid) return "Pincode not serviceable";
    if (loading && !processingPayment) return "Creating Order...";
    if (processingPayment) return "Complete Payment in Popup...";
    if (grandTotal === 0) return "Place Order (Free) 🎉";
    if (paymentMethod === "online")
      return `Pay ₹${grandTotal.toLocaleString()} Online`;
    return `Pay ₹${advanceAmount.toLocaleString()} Advance (10% of ₹${grandTotal.toLocaleString()})`;
  })();

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

          {/* Deactivated warning */}
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
                    Please remove them to proceed.
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

              {/* Shipping Options */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-primary" />
                  Shipping Options
                  {shippingLoading && (
                    <ArrowPathIcon className="w-4 h-4 animate-spin text-primary ml-2" />
                  )}
                </h3>

                {form.pincode && form.pincode.length !== 6 && (
                  <p className="text-sm text-yellow-600 mb-3">
                    ⚠️ Please enter a valid 6-digit pincode to see shipping
                    options
                  </p>
                )}

                {shippingLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-text-light">
                      Checking shipping availability...
                    </span>
                  </div>
                ) : shippingError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{shippingError}</p>
                  </div>
                ) : shippingOptions.length > 0 && isPincodeValid ? (
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                          selectedShipping?.id === option.id
                            ? "border-primary bg-[#EBF4FC]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={option.id}
                          checked={selectedShipping?.id === option.id}
                          onChange={() => setSelectedShipping(option)}
                          className="mt-1 text-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-text">
                              {option.name}
                            </p>
                            <p className="font-bold text-primary">
                              ₹{option.price}
                            </p>
                          </div>
                          <p className="text-xs text-text-light">
                            {option.delivery}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : form.pincode &&
                  form.pincode.length === 6 &&
                  !isPincodeValid &&
                  !shippingLoading ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      ⚠️ We don't deliver to this pincode yet. Please check your
                      pincode.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Payment Method */}
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
                disabled={isSubmitDisabled}
                className={`w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasDeactivatedProducts ? "bg-gray-400 hover:bg-gray-400" : ""
                }`}
              >
                {submitLabel}
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

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Coupon */}
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
                              ? `${appliedCoupon.discountValue}% off${
                                  appliedCoupon.maxDiscount
                                    ? ` (max ₹${appliedCoupon.maxDiscount})`
                                    : ""
                                }`
                              : `₹${appliedCoupon.discountValue} off`}
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
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
                    const variantName = item.variant?.name || "";
                    const price = isBuyNow
                      ? item.price
                      : safeNumber(item.price) ||
                        safeNumber(item.product?.comparePrice) ||
                        safeNumber(item.product?.price);
                    const quantity = item.quantity || 1;
                    const isDeactivated = isBuyNow
                      ? false
                      : item.product?.isActive === false;

                    return (
                      <div
                        key={isBuyNow ? `buynow-${index}` : item._id}
                        className={`flex justify-between text-sm py-2 border-b border-gray-50 ${
                          isDeactivated ? "opacity-50" : ""
                        }`}
                      >
                        <span className="truncate mr-2">
                          {isDeactivated && "⚠️ "}
                          {name}
                          {variantName && (
                            <span className="text-xs text-primary ml-1">
                              ({variantName})
                            </span>
                          )}{" "}
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
