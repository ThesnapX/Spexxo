import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  TicketIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Cart = () => {
  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = cartTotal;
  const shippingCost = subtotal >= 999 ? 0 : 99;

  // Dynamic coupon discount calculation
  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    let discountBase = subtotal;
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
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingCost);

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
        cartTotal: subtotal,
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

  if (loading) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-2xl font-bold text-text mb-2">
            Your Cart is Empty
          </h2>
          <p className="text-text-light mb-6">
            Looks like you haven't added anything yet
          </p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Shopping Cart" />
      <div className="pt-24 pb-16">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-sm text-text-light mb-8">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-text">Cart ({cartCount} items)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const productSlug = item.product?.slug || "";
                const productName =
                  item.product?.name || item.name || "Product";
                const productImage =
                  item.product?.images?.[0]?.url ||
                  item.image ||
                  "/images/products/placeholder.jpg";
                const productPrice =
                  item.price ||
                  item.product?.comparePrice ||
                  item.product?.price ||
                  0;
                const brandName = item.product?.brand?.name || "";
                const hasValidSlug = productSlug && productSlug.length > 0;

                return (
                  <div
                    key={item._id}
                    className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100"
                  >
                    {hasValidSlug ? (
                      <Link
                        to={`/product/${productSlug}`}
                        className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0"
                      >
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {hasValidSlug ? (
                        <Link
                          to={`/product/${productSlug}`}
                          className="font-medium text-text hover:text-primary transition line-clamp-1 block"
                        >
                          {productName}
                        </Link>
                      ) : (
                        <span className="font-medium text-text">
                          {productName}
                        </span>
                      )}
                      {brandName && (
                        <p className="text-xs text-text-light mt-0.5">
                          {brandName}
                        </p>
                      )}
                      {item.variant?.name && (
                        <p className="text-xs text-text-light mt-0.5">
                          {item.variant.name}
                        </p>
                      )}
                      <p className="text-primary font-semibold mt-2">
                        ₹{productPrice?.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() =>
                              item.quantity > 1 &&
                              updateQuantity(item._id, item.quantity - 1)
                            }
                            className="p-1.5 hover:bg-gray-50"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="px-3 font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
                            className="p-1.5 hover:bg-gray-50"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <TrashIcon className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-text">
                        ₹
                        {(productPrice * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-text mb-4">
                  Order Summary
                </h2>

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

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-light">
                      Subtotal ({cartCount} items)
                    </span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-light">Shipping</span>
                    <span
                      className={
                        shippingCost === 0 ? "text-green-600 font-medium" : ""
                      }
                    >
                      {shippingCost === 0 ? "Free" : `₹${shippingCost}`}
                    </span>
                  </div>
                  {shippingCost > 0 && (
                    <p className="text-xs text-text-light">
                      Add ₹{(999 - subtotal).toLocaleString()} more for free
                      shipping
                    </p>
                  )}
                </div>

                <div className="border-t mt-4 pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-text">Total</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">
                      ₹{Math.max(0, grandTotal).toLocaleString()}
                    </span>
                    {couponDiscount > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        You save ₹{couponDiscount.toLocaleString()}!
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="btn-primary w-full text-center block py-3 mt-6"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/shop"
                  className="block text-center text-primary mt-3 text-sm hover:underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
