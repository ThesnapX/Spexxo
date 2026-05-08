import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  StarIcon,
  HeartIcon,
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import SEO from "../components/common/SEO";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProductDetail = () => {
  const { slug } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/${slug}`);
      return data;
    },
  });

  const product = data?.product;
  const relatedProducts = data?.relatedProducts || [];

  const handleAddToCart = () => {
    addToCart(product._id, quantity, selectedVariant);
    toast.success("Added to cart!");
  };

  if (isLoading) {
    return (
      <div className="pt-28">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-28">
        <div className="container-custom text-center py-20">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-text mb-2">
            Product Not Found
          </h2>
          <Link to="/shop" className="btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={product.name}
        description={product.shortDescription || product.description}
        ogImage={product.images?.[0]?.url}
      />
      <div className="pt-28 pb-16">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-light mb-8">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link to="/shop" className="hover:text-primary">
              Shop
            </Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-text">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div>
              <div className="bg-gray-50 rounded-2xl overflow-hidden mb-4">
                <img
                  src={
                    product.images?.[selectedImage]?.url ||
                    "/images/products/placeholder.jpg"
                  }
                  alt={product.name}
                  className="w-full h-[500px] object-cover hover:scale-150 transition-transform duration-500 cursor-zoom-in"
                />
              </div>
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === index ? "border-primary" : "border-gray-200"}`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.brand?.name && (
                <p className="text-sm text-primary font-medium mb-2">
                  {product.brand.name}
                </p>
              )}
              <h1 className="text-3xl font-bold text-text mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) =>
                    i < Math.round(product.ratings?.average || 0) ? (
                      <StarSolid key={i} className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <StarIcon key={i} className="w-5 h-5 text-gray-300" />
                    ),
                  )}
                </div>
                <span className="text-sm text-text-light">
                  ({product.ratings?.count || 0} reviews)
                </span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-text">
                  ₹{product.price?.toLocaleString()}
                </span>
                {product.comparePrice &&
                  product.comparePrice > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        ₹{product.comparePrice.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                        {Math.round(
                          ((product.comparePrice - product.price) /
                            product.comparePrice) *
                            100,
                        )}
                        % OFF
                      </span>
                    </>
                  )}
              </div>
              <p className="text-text-light mb-6">
                {product.shortDescription || product.description}
              </p>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-text mb-3">
                    Available Options
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 border rounded-lg text-sm transition ${selectedVariant?.sku === variant.sku ? "border-primary bg-primary/5 text-primary" : "border-gray-200 hover:border-primary/50"}`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-semibold text-text">Quantity:</h3>
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-50 transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-50 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-4 text-lg"
                >
                  <ShoppingBagIcon className="w-6 h-6" /> Add to Cart
                </button>
                <button
                  onClick={() =>
                    isInWishlist(product._id)
                      ? removeFromWishlist(product._id)
                      : addToWishlist(product._id)
                  }
                  className={`w-14 h-14 flex items-center justify-center border-2 rounded-xl transition ${isInWishlist(product._id) ? "border-red-500 bg-red-50 text-red-500" : "border-gray-200 hover:border-primary hover:text-primary"}`}
                >
                  {isInWishlist(product._id) ? (
                    <HeartSolid className="w-6 h-6" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-text-light">
                  <TruckIcon className="w-5 h-5 text-primary" /> Free Shipping
                </div>
                <div className="flex items-center gap-2 text-sm text-text-light">
                  <ShieldCheckIcon className="w-5 h-5 text-primary" /> COD
                  Available
                </div>
              </div>

              {/* Specifications */}
              {product.specifications?.length > 0 && (
                <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-text mb-3">
                    Specifications
                  </h3>
                  <div className="space-y-2">
                    {product.specifications.map((spec, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-text-light">{spec.name}</span>
                        <span className="font-medium text-text">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-text mb-8">
                Related Products
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((rp) => (
                  <Link
                    key={rp._id}
                    to={`/product/${rp.slug}`}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition"
                  >
                    <img
                      src={
                        rp.images?.[0]?.url ||
                        "/images/products/placeholder.jpg"
                      }
                      alt={rp.name}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {rp.name}
                      </h3>
                      <p className="text-primary font-semibold mt-1">
                        ₹{rp.price?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
