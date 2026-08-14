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
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Checkout = () => {
  const { cart, cartTotal, clearCart, appliedCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [codAdvance, setCodAdvance] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressList, setShowAddressList] = useState(false);
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

  useEffect(() => {
    if (user?.defaultAddress?.addressLine1) {
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

  // Calculate 10% advance amount
  const advanceAmount = Math.round(grandTotal * 0.1);
  const remainingCOD = grandTotal - advanceAmount;

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

    if (paymentMethod === "online") {
      // ONLINE PAYMENT
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
    } else if (paymentMethod === "cod" && codAdvance) {
      // COD with 10% Advance - Open Razorpay for advance amount
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
                  "Advance payment cancelled. You can still place COD order without advance.",
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
                  paymentStatus: "paid", // Advance paid
                  codAdvance: true,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                await clearCart();
                toast.success(
                  "Order placed with 10% advance! Remaining on delivery.",
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
    } else {
      // Full COD
      setLoading(true);
      try {
        await axios.post(`${API_URL}/orders`, {
          shippingAddress: form,
          couponCode: couponCode || undefined,
          paymentMethod: "cod",
        });
        await clearCart();
        toast.success("Order placed successfully!");
        navigate("/account/orders");
      } catch (error) {
        toast.error(error.response?.data?.message || "Order failed");
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

              {/* Saved Address Option */}
              {/* Multiple Address Selection */}
              {user?.addresses?.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Select Delivery Address
                  </label>
                  <div className="space-y-2">
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
                        }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition ${selectedAddressId === addr._id ? "border-primary bg-[#EBF4FC]" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="flex items-center gap-2">
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
                          {addr.addressLine1}, {addr.city}, {addr.state} -{" "}
                          {addr.pincode}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {user?.defaultAddress?.addressLine1 && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setUseSavedAddress(true)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${useSavedAddress ? "border-primary bg-[#EBF4FC]" : "border-gray-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${useSavedAddress ? "border-primary bg-primary" : "border-gray-300"}`}
                      >
                        {useSavedAddress && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-text text-sm">
                          Saved Address
                        </span>
                        <p className="text-sm font-medium text-text mt-1">
                          {user.defaultAddress.fullName}
                        </p>
                        <p className="text-xs text-text-light">
                          {user.defaultAddress.addressLine1},{" "}
                          {user.defaultAddress.city},{" "}
                          {user.defaultAddress.state} -{" "}
                          {user.defaultAddress.pincode}
                        </p>
                        <p className="text-xs text-text-light">
                          📞 {user.defaultAddress.phone}
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSavedAddress(false)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition mt-2 ${!useSavedAddress ? "border-primary bg-[#EBF4FC]" : "border-gray-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${!useSavedAddress ? "border-primary bg-primary" : "border-gray-300"}`}
                      >
                        {!useSavedAddress && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-text">
                        <PlusIcon className="w-4 h-4 inline mr-1" />
                        Use a new address
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(!user?.defaultAddress?.addressLine1 || !useSavedAddress) && (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 mb-6"
                >
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      defaultChecked
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm text-text-light">
                      Save this address for future orders
                    </span>
                  </label>
                </form>
              )}

              {/* Payment Method Selection */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h3 className="font-semibold text-text mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === "cod" ? "border-primary bg-[#EBF4FC]" : "border-gray-200 hover:border-gray-300"}`}
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
                        Pay when you receive your order
                      </p>
                    </div>
                  </label>

                  {/* COD Advance Option */}
                  {paymentMethod === "cod" && (
                    <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={codAdvance}
                          onChange={(e) => setCodAdvance(e.target.checked)}
                          className="mt-0.5 text-primary w-4 h-4"
                        />
                        <div>
                          <p className="text-sm font-medium text-text">
                            Pay 10% Advance (Recommended)
                          </p>
                          <p className="text-xs text-text-light">
                            Pay ₹{advanceAmount.toLocaleString()} now, remaining
                            ₹{remainingCOD.toLocaleString()} on delivery
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  <label
                    className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === "online" ? "border-primary bg-[#EBF4FC]" : "border-gray-200 hover:border-gray-300"}`}
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
                        Pay securely via UPI, Cards, NetBanking, Wallets
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || processingPayment}
                className="w-full btn-primary py-4 text-base"
              >
                {loading && !processingPayment
                  ? "Creating Order..."
                  : processingPayment
                    ? "Complete Payment in Popup..."
                    : paymentMethod === "online"
                      ? `Pay ₹${grandTotal.toLocaleString()} Online`
                      : codAdvance
                        ? `Pay ₹${advanceAmount.toLocaleString()} Advance`
                        : `Place Order - ₹${grandTotal.toLocaleString()}`}
              </button>
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
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
                      className="flex justify-between text-sm py-2"
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
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <p className="text-xs text-green-600">
                      You save ₹{couponDiscount.toLocaleString()}!
                    </p>
                  )}
                  {codAdvance && (
                    <div className="bg-amber-50 p-3 rounded-lg mt-3">
                      <div className="flex justify-between text-sm">
                        <span>Pay Now (10%)</span>
                        <span className="font-semibold text-amber-600">
                          ₹{advanceAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pay on Delivery</span>
                        <span className="font-semibold">
                          ₹{remainingCOD.toLocaleString()}
                        </span>
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
