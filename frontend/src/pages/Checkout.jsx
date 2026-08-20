import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const {
    cart,
    cartTotal,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
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

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const shippingCost = cartTotal >= 999 ? 0 : 99;

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    let discountBase = cartTotal;
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
  const grandTotal = Math.max(0, cartTotal - couponDiscount + shippingCost);

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
        cartTotal: cartTotal,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for deactivated products before proceeding
    if (hasDeactivatedProducts) {
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

    if (paymentMethod === "online") {
      setLoading(true);
      try {
        const amountInPaise = Math.round(grandTotal * 100);
        setProcessingPayment(true);

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          // Get product names for notes
          const productNames = cart.items
            .map((item) => item.product?.name || item.name)
            .join(", ");

          const options = {
            key: RAZORPAY_KEY,
            amount: amountInPaise,
            currency: "INR",
            name: "Spexxo",
            description: productNames || "Spexxo Eyewear",
            image: "/images/logo.png",
            prefill: {
              name: form.fullName,
              email: user?.email || "customer@spexxo.com",
              contact: form.phone || "9999999999",
            },
            theme: { color: "#3D96EB" },
            modal: {
              ondismiss: function () {
                setProcessingPayment(false);
                setLoading(false);
                toast.error("Payment cancelled");
              },
            },
            handler: async function (response) {
              try {
                setProcessingPayment(false);
                const orderData = {
                  shippingAddress: form,
                  couponCode: couponCodeApplied || undefined,
                  paymentMethod: "online",
                  paymentStatus: "paid",
                  isCOD: false,
                  orderStatus: "pending",
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                };

                const { data } = await axios.post(
                  `${API_URL}/orders`,
                  orderData,
                );
                await clearCart();
                toast.success("Payment successful! Order placed!");
                navigate(`/account/orders/${data.order._id}`);
              } catch (error) {
                console.error("Order creation error:", error);
                toast.error(
                  "Order creation failed after payment. Contact support.",
                );
                navigate("/account/orders");
              }
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Payment initiation error:", error);
        toast.error("Payment initiation failed");
        setProcessingPayment(false);
      } finally {
        setLoading(false);
      }
    } else {
      // COD Payment
      setLoading(true);
      try {
        // For COD with advance payment
        if (advanceAmount > 0) {
          const advanceAmountInPaise = advanceAmount * 100;
          setProcessingPayment(true);

          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => {
            const options = {
              key: RAZORPAY_KEY,
              amount: advanceAmountInPaise,
              currency: "INR",
              name: "Spexxo",
              description: "10% Advance Payment (COD Order)",
              image: "/images/logo.png",
              prefill: {
                name: form.fullName,
                email: user?.email || "customer@spexxo.com",
                contact: form.phone || "9999999999",
              },
              theme: { color: "#3D96EB" },
              modal: {
                ondismiss: function () {
                  setProcessingPayment(false);
                  setLoading(false);
                  toast.error(
                    "Advance payment is required for COD orders. Please complete the payment.",
                  );
                },
              },
              handler: async function (response) {
                try {
                  setProcessingPayment(false);
                  // Create order with COD advance payment - status set to "pending"
                  const orderData = {
                    shippingAddress: form,
                    couponCode: couponCodeApplied || undefined,
                    paymentMethod: "cod",
                    paymentStatus: "paid",
                    isCOD: true,
                    orderStatus: "pending", // Changed from "confirmed" to "pending"
                    codAdvance: advanceAmount,
                    remainingCOD: remainingCOD,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  };

                  const { data } = await axios.post(
                    `${API_URL}/orders`,
                    orderData,
                  );
                  await clearCart();
                  toast.success(
                    "Order placed with 10% advance! Remaining ₹" +
                      remainingCOD.toLocaleString() +
                      " on delivery.",
                  );
                  navigate(`/account/orders/${data.order._id}`);
                } catch (error) {
                  console.error("COD order creation error:", error);
                  toast.error(
                    "Order creation failed after advance payment. Contact support.",
                  );
                  navigate("/account/orders");
                }
              },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          };
          document.body.appendChild(script);
        } else {
          // COD without advance - status set to "pending"
          const orderData = {
            shippingAddress: form,
            couponCode: couponCodeApplied || undefined,
            paymentMethod: "cod",
            paymentStatus: "pending",
            isCOD: true,
            orderStatus: "pending", // Changed from undefined to "pending"
          };

          const { data } = await axios.post(`${API_URL}/orders`, orderData);
          await clearCart();
          toast.success("Order placed successfully!");
          navigate(`/account/orders/${data.order._id}`);
        }
      } catch (error) {
        console.error("COD order error:", error);
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
  if (!cart?.items?.length) {
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

  return (
    <>
      <SEO title="Checkout" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-8">
            Checkout
          </h1>

          {/* Deactivated Products Warning */}
          {hasDeactivatedProducts && (
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

              <form className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 mb-6">
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
              </form>

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

                  {paymentMethod === "cod" && (
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
                !hasDeactivatedProducts && (
                  <p className="text-xs text-text-light text-center mt-2">
                    You'll pay remaining ₹{remainingCOD.toLocaleString()} on
                    delivery
                  </p>
                )}
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

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
                  {cart.items.map((item) => {
                    const name = item.product?.name || item.name || "Product";
                    const variantName = item.variant?.name || "";
                    const price =
                      item.variant?.price ||
                      item.product?.comparePrice ||
                      item.product?.price ||
                      0;
                    const isDeactivated = item.product?.isActive === false;

                    return (
                      <div
                        key={item._id}
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
                          × {item.quantity}
                        </span>
                        <span className="flex-shrink-0">
                          ₹{(price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {hasDeactivatedProducts && (
                  <div className="bg-red-50 p-3 rounded-lg mt-3 border border-red-200">
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Deactivated products found. Please remove them from
                      your cart.
                    </p>
                    <Link
                      to="/cart"
                      className="text-xs text-red-700 hover:underline mt-1 inline-block"
                    >
                      Go to Cart
                    </Link>
                  </div>
                )}
                <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
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
                  {couponDiscount > 0 && (
                    <p className="text-xs text-green-600">
                      🎉 You saved ₹{couponDiscount.toLocaleString()}!
                    </p>
                  )}
                  {paymentMethod === "cod" && !hasDeactivatedProducts && (
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
                        <span className="text-amber-700">Pay on Delivery</span>
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
                  to="/cart"
                  className="block text-center text-primary text-sm mt-4 hover:underline"
                >
                  ← Back to Cart
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
