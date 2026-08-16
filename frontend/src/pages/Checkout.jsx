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
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Checkout = () => {
  const { cart, cartTotal, clearCart, appliedCoupon } = useCart();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressList, setShowAddressList] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
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

  // Load default address on mount
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      // Find default address or use first one
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
      // Fallback to old defaultAddress field
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
      // No saved address - show form
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
  const couponCode = appliedCoupon?.code || "";
  const grandTotal = Math.max(0, cartTotal - couponDiscount + shippingCost);

  // Calculate 10% advance amount (MANDATORY for COD)
  const advanceAmount = Math.round(grandTotal * 0.1);
  const remainingCOD = grandTotal - advanceAmount;

  // Function to refresh user data after address save
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

  // Function to save address to user profile
  const saveAddressToUserProfile = async (addressData) => {
    try {
      await axios.post(`${API_URL}/users/address`, addressData);
      // Refresh user data to get the new address
      await refreshUserData();
      return true;
    } catch (error) {
      console.log("Failed to save address:", error.message);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    // If user is logged in and wants to save address
    if (user && saveAddressToProfile && !useSavedAddress) {
      // Check if address already exists
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
      // ONLINE PAYMENT - Full payment
      setLoading(true);
      try {
        const amountInPaise = Math.round(grandTotal * 100);
        setProcessingPayment(true);

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: amountInPaise,
            currency: "INR",
            name: "Spexxo",
            description: "Eyewear Purchase",
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
                await axios.post(`${API_URL}/orders`, {
                  shippingAddress: form,
                  couponCode: couponCode || undefined,
                  paymentMethod: "online",
                  paymentStatus: "paid",
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                await clearCart();
                toast.success("Payment successful! Order placed!");
                navigate("/account/orders");
              } catch (error) {
                toast.error(
                  "Order creation failed after payment. Contact support.",
                );
              }
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } catch (error) {
        toast.error("Payment initiation failed");
        setProcessingPayment(false);
      } finally {
        setLoading(false);
      }
    } else {
      // COD - 10% Advance is MANDATORY
      setLoading(true);
      try {
        const advanceAmountInPaise = advanceAmount * 100;
        setProcessingPayment(true);

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
                await axios.post(`${API_URL}/orders`, {
                  shippingAddress: form,
                  couponCode: couponCode || undefined,
                  paymentMethod: "cod",
                  paymentStatus: "paid",
                  codAdvance: true,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                await clearCart();
                toast.success(
                  "Order placed with 10% advance! Remaining ₹" +
                    remainingCOD.toLocaleString() +
                    " on delivery.",
                );
                navigate("/account/orders");
              } catch (error) {
                toast.error(
                  "Order creation failed after advance payment. Contact support.",
                );
              }
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } catch (error) {
        toast.error("Payment initiation failed");
        setProcessingPayment(false);
      } finally {
        setLoading(false);
      }
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Side - Address & Payment */}
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-primary" /> Shipping Address
              </h2>

              {/* Address Selection - Show if user has saved addresses */}
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

              {/* New Address Form */}
              <form className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    placeholder="House/Flat No., Building, Street"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    placeholder="Colony, Apartment Name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={form.landmark}
                      onChange={handleChange}
                      placeholder="Nearby landmark"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      name="area"
                      value={form.area}
                      onChange={handleChange}
                      placeholder="Locality"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Save Address Option - Only show if user is logged in */}
                {user && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) =>
                        setSaveAddressToProfile(e.target.checked)
                      }
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm text-text-light">
                      Save this address for future orders
                    </span>
                  </label>
                )}
              </form>

              {/* Payment Method Selection */}
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

                  {/* COD Advance Info - Always shown for COD */}
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

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || processingPayment}
                className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && !processingPayment
                  ? "Creating Order..."
                  : processingPayment
                    ? "Complete Payment in Popup..."
                    : paymentMethod === "online"
                      ? `Pay ₹${grandTotal.toLocaleString()} Online`
                      : `Pay ₹${advanceAmount.toLocaleString()} Advance (10% of ₹${grandTotal.toLocaleString()})`}
              </button>
              {paymentMethod === "cod" && !processingPayment && !loading && (
                <p className="text-xs text-text-light text-center mt-2">
                  You'll pay remaining ₹{remainingCOD.toLocaleString()} on
                  delivery
                </p>
              )}
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="max-h-60 overflow-y-auto">
                  {cart.items.map((item) => {
                    const name = item.product?.name || item.name || "Product";
                    const price =
                      item.price ||
                      item.product?.comparePrice ||
                      item.product?.price ||
                      0;
                    return (
                      <div
                        key={item._id}
                        className="flex justify-between text-sm py-2 border-b border-gray-50"
                      >
                        <span className="truncate mr-2">
                          {name} × {item.quantity}
                        </span>
                        <span className="flex-shrink-0">
                          ₹{(price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount{couponCode ? ` (${couponCode})` : ""}
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
                  {/* COD Advance Breakdown - Always shown when COD is selected */}
                  {paymentMethod === "cod" && (
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
