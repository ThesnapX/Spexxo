// frontend/src/components/common/ProductCard.jsx

import { Link } from "react-router-dom";
import {
  HeartIcon,
  ShoppingBagIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const PlaceholderImage = ({ className = "" }) => (
  <div
    className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
  >
    <svg
      className="w-12 h-12 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </div>
);

const ProductCard = ({ product, showSaleBadge = false, onRequireAuth }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  if (!product) return null;

  const isDeactivated = product.isActive === false;
  const hasVariants = product.variants && product.variants.length > 0;

  // Get the default variant's image if variants exist
  const getProductImage = () => {
    if (hasVariants && product.variants.length > 0) {
      // Find the default variant
      let defaultVariant = product.variants.find((v) => v.isDefault === true);
      // If no default variant is marked, use the first one
      if (!defaultVariant) {
        defaultVariant = product.variants[0];
      }
      if (defaultVariant.images && defaultVariant.images.length > 0) {
        return defaultVariant.images[0].url;
      }
    }
    // Fallback to product images
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return null;
  };

  const productImage = getProductImage();

  // Check stock for simple products
  const isOutOfStock =
    !hasVariants &&
    (product.stock === 0 ||
      product.stock === null ||
      product.stock === undefined);

  // ✅ FIXED: Get display price and original price
  let displayPrice = product.price || 0;
  let originalPrice = product.price || 0;
  let hasDiscount = false;
  let discountPercent = 0;

  // For variable products, get the lowest price among variants
  if (hasVariants) {
    const variantPrices = product.variants.map((v) => v.price || 0);
    const variantComparePrices = product.variants.map(
      (v) => v.comparePrice || 0,
    );
    const minPrice = Math.min(...variantPrices);
    const minCompare = Math.min(...variantComparePrices);

    // If compare price exists and is less than price, it's a sale
    if (minCompare > 0 && minCompare < minPrice) {
      displayPrice = minCompare;
      originalPrice = minPrice;
      hasDiscount = true;
      discountPercent = Math.round(((minPrice - minCompare) / minPrice) * 100);
    } else {
      displayPrice = minPrice;
      originalPrice = minPrice;
    }
  } else {
    // Simple product
    if (product.comparePrice && product.comparePrice < product.price) {
      displayPrice = product.comparePrice;
      originalPrice = product.price;
      hasDiscount = true;
      discountPercent = Math.round(
        ((product.price - product.comparePrice) / product.price) * 100,
      );
    } else {
      displayPrice = product.price || 0;
      originalPrice = product.price || 0;
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeactivated) {
      toast.error("This product is currently deactivated");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    addToCart(product._id, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (isDeactivated || isOutOfStock) {
      toast.error(
        isDeactivated
          ? "This product is deactivated"
          : "This product is out of stock",
      );
      return;
    }
    isInWishlist(product._id)
      ? removeFromWishlist(product._id)
      : addToWishlist(product._id);
  };

  // Determine card styling
  let cardClasses =
    "group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 ";
  if (isDeactivated) {
    cardClasses += "border-gray-200 opacity-60 grayscale";
  } else if (isOutOfStock) {
    cardClasses += "border-gray-200 opacity-70";
  } else {
    cardClasses += "border-gray-100";
  }

  return (
    <div className={cardClasses}>
      <div className="relative overflow-hidden bg-gray-50">
        <Link to={`/product/${product.slug}`}>
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-56 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <PlaceholderImage className="w-full h-56 md:h-64" />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isDeactivated ? (
            <span className="bg-gray-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Deactivated
            </span>
          ) : isOutOfStock ? (
            <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          ) : (
            showSaleBadge &&
            hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {discountPercent}% OFF
              </span>
            )
          )}
          {hasVariants && !isDeactivated && (
            <span className="bg-purple-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="text-[10px]">📦</span>
              {product.variants.length} Variants
            </span>
          )}
        </div>

        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
            isDeactivated || isOutOfStock
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-primary hover:text-white"
          }`}
          disabled={isDeactivated || isOutOfStock}
        >
          {isInWishlist(product._id) ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && !isDeactivated && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full rotate-[-15deg] shadow-lg">
              OUT OF STOCK
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {product.brand?.name && (
          <p className="text-xs text-text-light mb-1 truncate">
            {product.brand.name}
          </p>
        )}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-sm text-text mb-2 line-clamp-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>

        {/* ✅ FIXED: Price with discount display */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`font-bold ${
              isDeactivated || isOutOfStock ? "text-gray-400" : "text-text"
            }`}
          >
            ₹{displayPrice?.toLocaleString()}
          </span>
          {hasDiscount &&
            !isDeactivated &&
            !isOutOfStock &&
            originalPrice > displayPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{originalPrice?.toLocaleString()}
              </span>
            )}
          {hasDiscount && !isDeactivated && !isOutOfStock && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {discountPercent}% off
            </span>
          )}
          {hasVariants && !isDeactivated && (
            <span className="text-xs text-purple-500 font-medium">
              ({product.variants.length} variants)
            </span>
          )}
        </div>

        {/* Show "View Product" for variant products */}
        {hasVariants ? (
          <Link
            to={`/product/${product.slug}`}
            className="w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white"
          >
            <EyeIcon className="w-4 h-4" /> View Product
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isDeactivated || isOutOfStock}
            className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
              isDeactivated || isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
            }`}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            {isDeactivated
              ? "Unavailable"
              : isOutOfStock
                ? "Out of Stock"
                : "Add to Cart"}
          </button>
        )}
        {isDeactivated && (
          <p className="text-xs text-red-500 text-center mt-1">
            ⚠️ Product deactivated
          </p>
        )}
        {isOutOfStock && !isDeactivated && (
          <p className="text-xs text-red-500 text-center mt-1">
            ⚠️ Out of stock
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
