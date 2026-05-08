import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import SEO from "../components/common/SEO";

const Cart = () => {
  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
  } = useCart();

  if (loading) {
    return (
      <div className="pt-28">
        <div className="container-custom text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="pt-28">
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
      <div className="pt-28 pb-16">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-sm text-text-light mb-8">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-text">Cart ({cartCount} items)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100"
                >
                  <Link
                    to={`/product/${item.product?.slug}`}
                    className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={
                        item.product?.images?.[0]?.url ||
                        "/images/products/placeholder.jpg"
                      }
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product?.slug}`}
                      className="font-medium text-text hover:text-primary transition"
                    >
                      {item.product?.name || "Product"}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-text-light mt-1">
                        {item.variant.name}
                      </p>
                    )}
                    <p className="text-primary font-semibold mt-2">
                      ₹{item.price?.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() =>
                            item.quantity > 1 &&
                            updateQuantity(item._id, item.quantity - 1)
                          }
                          className="p-1 hover:bg-gray-50"
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
                          className="p-1 hover:bg-gray-50"
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
                  <div className="text-right">
                    <p className="font-semibold text-text">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-28">
                <h2 className="text-lg font-semibold text-text mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3 text-sm border-b pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-text-light">Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light">Shipping</span>
                    <span className="text-green-600">
                      {cartTotal >= 999 ? "Free" : "₹99"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light">Tax</span>
                    <span>₹0</span>
                  </div>
                </div>
                <div className="flex justify-between font-semibold text-lg mb-6">
                  <span>Total</span>
                  <span className="text-primary">
                    ₹
                    {(cartTotal + (cartTotal >= 999 ? 0 : 99)).toLocaleString()}
                  </span>
                </div>
                <Link
                  to="/checkout"
                  className="btn-primary w-full text-center block py-3"
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
