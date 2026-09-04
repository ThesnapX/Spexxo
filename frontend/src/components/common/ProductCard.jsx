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
import {
  getProductImage,
  hasVariants,
  getProductPrice,
  isProductOutOfStock,
  getVariantCount,
} from "../../utils/productHelpers";

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

  // ✅ Get product data using helper functions
  const productImage = getProductImage(product);
  const hasVariantsFlag = hasVariants(product);
  const variantCount = getVariantCount(product);
  const { displayPrice, originalPrice, hasDiscount, discountPercent } =
    getProductPrice(product);
  const outOfStock = isProductOutOfStock(product);
  const isDeactivated = product.isActive === false;

  const hasAnyVariantInStock =
    hasVariantsFlag && product.variants.some((v) => v.stock > 0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeactivated) {
      toast.error("This product is currently deactivated");
      return;
    }
    if (outOfStock) {
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
    if (isDeactivated || outOfStock) {
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

  let cardClasses =
    "group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 ";
  if (isDeactivated) {
    cardClasses += "border-gray-200 opacity-60 grayscale";
  } else if (outOfStock) {
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
          ) : outOfStock ? (
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
          {hasVariantsFlag && !isDeactivated && hasAnyVariantInStock && (
            <span className="bg-purple-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="text-[10px]">📦</span>
              {variantCount} Variants
            </span>
          )}
        </div>

        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
            isDeactivated || outOfStock
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-primary hover:text-white"
          }`}
          disabled={isDeactivated || outOfStock}
        >
          {isInWishlist(product._id) ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </button>

        {/* Out of Stock Overlay */}
        {outOfStock && !isDeactivated && (
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

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`font-bold ${
              isDeactivated || outOfStock ? "text-gray-400" : "text-text"
            }`}
          >
            ₹{displayPrice?.toLocaleString()}
          </span>
          {hasDiscount &&
            !isDeactivated &&
            !outOfStock &&
            originalPrice > displayPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{originalPrice?.toLocaleString()}
              </span>
            )}
          {hasDiscount && !isDeactivated && !outOfStock && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {discountPercent}% off
            </span>
          )}
          {hasVariantsFlag && !isDeactivated && hasAnyVariantInStock && (
            <span className="text-xs text-purple-500 font-medium">
              ({variantCount} variants)
            </span>
          )}
        </div>

        {hasVariantsFlag ? (
          <Link
            to={`/product/${product.slug}`}
            className="w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white"
          >
            <EyeIcon className="w-4 h-4" /> View Product
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isDeactivated || outOfStock}
            className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
              isDeactivated || outOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
            }`}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            {isDeactivated
              ? "Unavailable"
              : outOfStock
                ? "Out of Stock"
                : "Add to Cart"}
          </button>
        )}
        {isDeactivated && (
          <p className="text-xs text-red-500 text-center mt-1">
            ⚠️ Product deactivated
          </p>
        )}
        {outOfStock && !isDeactivated && (
          <p className="text-xs text-red-500 text-center mt-1">
            ⚠️ Out of stock
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
