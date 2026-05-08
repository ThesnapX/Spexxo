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
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
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
    setLoading(true);
    try {
      await axios.post(`${API_URL}/orders`, { shippingAddress: form });
      await clearCart();
      toast.success("Order placed successfully!");
      navigate("/account/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-text mb-2">Cart is Empty</h2>
          <Link to="/shop" className="btn-primary">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = cartTotal >= 999 ? 0 : 99;
  const grandTotal = cartTotal + shippingCost;

  return (
    <>
      <SEO title="Checkout" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-8">
            Checkout
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-primary" /> Shipping Address
              </h2>

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

              {(!user?.defaultAddress?.addressLine1 || !useSavedAddress) && (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 bg-white p-5 rounded-xl border border-gray-100"
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

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 btn-primary py-4 text-base"
              >
                {loading
                  ? "Placing Order..."
                  : `Place Order - ₹${grandTotal.toLocaleString()}`}
              </button>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                {cart.items.map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between text-sm py-2"
                  >
                    <span>
                      {item.product?.name} x {item.quantity}
                    </span>
                    <span>
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">
                      {shippingCost === 0 ? "FREE" : `₹${shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  💵 Cash on Delivery Available
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
