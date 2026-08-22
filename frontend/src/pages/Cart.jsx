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
  ExclamationCircleIcon,
  ArrowPathIcon,
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
    removeDeactivatedItems,
    refreshCart,
    refreshCartWithLatestData,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Check for deactivated items
  const hasDeactivated =
    cart?.items?.some((item) => item.product?.isActive === false) || false;

  // Check for stock issues
  const hasStockIssue =
    cart?.items?.some(
      (item) => item.product && item.quantity > item.product.stock,
    ) || false;

  // Auto-refresh cart on mount to get latest prices
  useEffect(() => {
    refreshCartWithLatestData();
  }, []);

  useEffect(() => {
    if (loading) {
      setIsCartLoading(true);
    } else {
      const timer = setTimeout(() => setIsCartLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && cart?.items) {
      setIsCartLoading(false);
    }
  }, [loading, cart]);

  // Replace the loading check with:
  if (isCartLoading || loading) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-text-light mt-4">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCartWithLatestData();
    setIsRefreshing(false);
    toast.success("Cart updated with latest prices");
  };

  const handleRemoveDeactivated = async () => {
    setIsRefreshing(true);
    await removeDeactivatedItems();
    setIsRefreshing(false);
    toast.success("Deactivated items removed");
  };

  const subtotal = cartTotal;
  const shippingCost = subtotal >= 999 ? 0 : 99;

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

  const handleQuantityChange = (itemId, newQuantity, maxStock) => {
    // Validate quantity
    if (newQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    // Check if quantity exceeds stock
    if (maxStock !== undefined && maxStock !== null && newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }

    updateQuantity(itemId, newQuantity);
  };

  if (loading || isRefreshing) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-text-light mt-4">
            {isRefreshing
              ? "Updating cart with latest prices..."
              : "Loading your cart..."}
          </p>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <>
        <SEO title="Shopping Cart" />
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
      </>
    );
  }

  // Get active items for display
  const activeItems = cart.items.filter(
    (item) => item.product?.isActive !== false,
  );

  return (
    <>
      <SEO title="Shopping Cart" />
      <div className="pt-24 pb-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-text-light">
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <ChevronRightIcon className="w-4 h-4" />
              <span className="text-text">
                Cart ({activeItems.length} items)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Updating..." : "Refresh Prices"}
              </button>
              {hasDeactivated && (
                <button
                  onClick={handleRemoveDeactivated}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <ExclamationCircleIcon className="w-4 h-4" />
                  Remove deactivated
                </button>
              )}
            </div>
          </div>

          {/* Stock Warning */}
          {hasStockIssue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700">Stock Updated</p>
                  <p className="text-sm text-yellow-600">
                    Some items in your cart have limited stock. Quantities have
                    been adjusted. Please review your cart before checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {/* Deactivated Products Warning */}
              {hasDeactivated && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">
                        Deactivated Products in Cart
                      </p>
                      <p className="text-sm text-red-600">
                        Some products in your cart have been deactivated and
                        cannot be ordered. Please remove them to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {cart.items.map((item) => {
                // Check if product exists
                if (!item.product) {
                  return null;
                }

                const isDeactivated = item.product?.isActive === false;
                const name = item.product?.name || item.name || "Product";

                // Use variant price if available, otherwise use product price
                const price =
                  item.price ||
                  item.product?.comparePrice ||
                  item.product?.price ||
                  0;
                const image =
                  item.image || item.product?.images?.[0]?.url || "";

                // Check variant stock properly
                let stock = item.product?.stock || 0;
                let variantName = null;
                let variantSku = null;
                let variantColor = null;

                if (item.variant) {
                  // Find variant in product's variants array
                  const foundVariant = item.product?.variants?.find(
                    (v) =>
                      v._id?.toString() === item.variant._id?.toString() ||
                      v.name === item.variant.name ||
                      v.sku === item.variant.sku,
                  );
                  if (foundVariant) {
                    stock = foundVariant.stock || 0;
                    variantName = foundVariant.name;
                    variantSku = foundVariant.sku;
                    variantColor = foundVariant.color;
                  }
                }

                const isOutOfStock = stock === 0;
                const isStockExceeded = item.quantity > stock;
                const canIncrease = stock > 0 && item.quantity < stock;

                return (
                  <div
                    key={item._id}
                    className={`flex items-start gap-4 p-4 rounded-xl ${
                      isDeactivated
                        ? "bg-red-50 border border-red-200 opacity-75"
                        : isStockExceeded
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-white border border-gray-100"
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/images/placeholder-product.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {isDeactivated && (
                        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                            DEACTIVATED
                          </span>
                        </div>
                      )}
                      {isOutOfStock && !isDeactivated && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product?.slug || "#"}`}
                        className={`font-medium text-text hover:text-primary transition line-clamp-1 ${
                          isDeactivated ? "opacity-60" : ""
                        }`}
                      >
                        {name}
                      </Link>
                      {item.product?.brand?.name && (
                        <p className="text-xs text-text-light">
                          {item.product.brand.name}
                        </p>
                      )}
                      {/* Show variant details */}
                      {item.variant && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-primary font-medium">
                            Variant: {variantName || item.variant.name}
                            {variantColor?.hexCode && (
                              <span
                                className="inline-block w-3 h-3 rounded-full ml-2 align-middle border"
                                style={{
                                  backgroundColor: variantColor.hexCode,
                                }}
                              />
                            )}
                          </p>
                          {variantSku && (
                            <p className="text-xs text-text-light">
                              SKU: {variantSku}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`font-bold ${isDeactivated ? "text-gray-400" : "text-text"}`}
                        >
                          ₹{price.toLocaleString()}
                        </span>
                        {isDeactivated && (
                          <span className="text-xs text-red-500 font-medium">
                            ⚠️ Unavailable
                          </span>
                        )}
                        {isOutOfStock && !isDeactivated && (
                          <span className="text-xs text-red-500 font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const newQty = item.quantity - 1;
                            if (newQty >= 1) {
                              updateQuantity(item._id, newQty);
                            }
                          }}
                          disabled={
                            isDeactivated || isOutOfStock || item.quantity <= 1
                          }
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                            isDeactivated || isOutOfStock || item.quantity <= 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "hover:bg-gray-100 text-text"
                          }`}
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              if (val <= stock || stock === 0) {
                                updateQuantity(item._id, val);
                              } else {
                                toast.error(
                                  `Only ${stock} items available in stock`,
                                );
                              }
                            }
                          }}
                          disabled={isDeactivated || isOutOfStock}
                          className={`w-12 text-center text-sm font-medium border rounded-lg py-1 focus:outline-none focus:border-primary ${
                            isDeactivated || isOutOfStock
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "border-gray-200"
                          }`}
                          min="1"
                          max={stock || 99}
                        />
                        <div className="relative group">
                          <button
                            onClick={() => {
                              const newQty = item.quantity + 1;
                              if (stock > 0 && newQty <= stock) {
                                updateQuantity(item._id, newQty);
                              } else if (stock === 0) {
                                toast.error("This product is out of stock");
                              } else {
                                toast.error(
                                  `Only ${stock} items available in stock`,
                                );
                              }
                            }}
                            disabled={
                              isDeactivated || isOutOfStock || !canIncrease
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                              isDeactivated || isOutOfStock || !canIncrease
                                ? "text-gray-300 cursor-not-allowed"
                                : "hover:bg-gray-100 text-text"
                            }`}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                          {!isDeactivated &&
                            !isOutOfStock &&
                            !canIncrease &&
                            stock > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Max stock reached ({stock} available)
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 transition p-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
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
                  className={`btn-primary w-full text-center block py-3 mt-6 ${
                    hasDeactivated || hasStockIssue
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  {hasDeactivated
                    ? "Remove deactivated items to proceed"
                    : hasStockIssue
                      ? "Fix stock issues to proceed"
                      : "Proceed to Checkout"}
                </Link>
                {hasDeactivated && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    ⚠️ Please remove deactivated items to checkout
                  </p>
                )}
                {hasStockIssue && !hasDeactivated && (
                  <p className="text-xs text-yellow-600 text-center mt-2">
                    ⚠️ Please adjust quantities to match available stock
                  </p>
                )}
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
