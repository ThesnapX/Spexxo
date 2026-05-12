import { Link } from "react-router-dom";
import { HeartIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
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

const ProductCard = ({ product, showSaleBadge = false }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const discount =
    product.comparePrice && product.price > product.comparePrice
      ? Math.round(
          ((product.price - product.comparePrice) / product.price) * 100,
        )
      : 0;

  const displayPrice = product.comparePrice || product.price;
  const hasDiscount =
    product.comparePrice && product.comparePrice < product.price;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product._id, 1);
    toast.success("Added to cart!");
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isInWishlist(product._id)
      ? removeFromWishlist(product._id)
      : addToWishlist(product._id);
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50">
        <Link to={`/product/${product.slug}`}>
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-56 md:h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <PlaceholderImage className="w-full h-56 md:h-64" />
          )}
        </Link>

        {/* Sale Badge */}
        {showSaleBadge && discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-all z-10"
        >
          {isInWishlist(product._id) ? (
            <HeartSolid className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand?.name && (
          <p className="text-xs text-text-light mb-1 truncate">
            {product.brand.name}
          </p>
        )}

        {/* Title */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-sm text-text mb-2 line-clamp-1 hover:text-primary transition">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-text">
            ₹{displayPrice?.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.price?.toLocaleString()}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-green-600">
              ({discount}% off)
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          className="w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition flex items-center justify-center gap-2"
        >
          <ShoppingBagIcon className="w-4 h-4" /> Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
