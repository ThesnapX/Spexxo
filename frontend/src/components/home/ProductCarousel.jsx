// frontend/src/components/home/ProductCarousel.jsx

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import SectionHeader from "../common/SectionHeader";
import LoadingSkeleton from "../common/LoadingSkeleton";
import { ShoppingBagIcon, EyeIcon } from "@heroicons/react/24/outline";
import {
  getProductImage,
  hasVariants,
  getProductPrice,
  isProductOutOfStock,
  getVariantCount,
} from "../../utils/productHelpers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProductCarousel = ({
  title,
  subtitle,
  queryKey,
  apiParams,
  linkTo,
  showSaleBadge = false,
  onRequireAuth,
}) => {
  // ✅ OPTIMIZED: Better caching and error handling
  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey, JSON.stringify(apiParams)],
    queryFn: async () => {
      try {
        const queryString = new URLSearchParams({
          limit: 10,
          ...apiParams,
        }).toString();
        const { data } = await axios.get(`${API_URL}/products?${queryString}`);
        return data.products || [];
      } catch (err) {
        console.error(`Failed to fetch ${queryKey}:`, err);
        return [];
      }
    },
    // ✅ Long cache time to prevent 429 errors
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const products = data || [];

  // ✅ If error (like 429), show cached or empty state
  if (error) {
    return (
      <section className="container-custom py-8">
        <SectionHeader title={title} subtitle={subtitle} linkTo={linkTo} />
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-text mb-1">Products Unavailable</h3>
          <p className="text-text-light text-sm">
            Please refresh the page to try again
          </p>
        </div>
      </section>
    );
  }

  const CarouselProductCard = ({ product }) => {
    const productImage = getProductImage(product);
    const hasVariantsFlag = hasVariants(product);
    const variantCount = getVariantCount(product);
    const { displayPrice, originalPrice, hasDiscount, discountPercent } =
      getProductPrice(product);
    const outOfStock = isProductOutOfStock(product);
    const isDeactivated = product.isActive === false;

    const hasAnyVariantInStock =
      hasVariantsFlag && product.variants.some((v) => v.stock > 0);

    return (
      <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        <div className="relative overflow-hidden bg-gray-50 flex-shrink-0">
          <Link to={`/product/${product.slug}`} className="block">
            {productImage ? (
              <img
                src={productImage}
                alt={product.name}
                className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
          </Link>

          {/* Badges */}
          {isDeactivated ? (
            <span className="absolute top-3 left-3 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              Inactive
            </span>
          ) : outOfStock ? (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </span>
          ) : (
            showSaleBadge &&
            hasDiscount && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {discountPercent}% OFF
              </span>
            )
          )}

          {hasVariantsFlag && !isDeactivated && hasAnyVariantInStock && (
            <span className="absolute top-3 right-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
              <span className="text-[10px]">📦</span>
              {variantCount} Variants
            </span>
          )}

          {outOfStock && !isDeactivated && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full rotate-[-15deg] shadow-lg">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          {product.brand?.name && (
            <p className="text-xs text-text-light mb-1 truncate">
              {product.brand.name}
            </p>
          )}
          <Link to={`/product/${product.slug}`} className="block flex-shrink-0">
            <h3 className="font-medium text-sm text-text mb-2 hover:text-primary transition">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-2 flex-wrap mt-auto">
            <span
              className={`font-bold ${isDeactivated || outOfStock ? "text-gray-400" : "text-text"}`}
            >
              ₹{displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && !isDeactivated && !outOfStock && (
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

          {/* Action Buttons */}
          {hasVariantsFlag ? (
            <Link
              to={`/product/${product.slug}`}
              className="w-full mt-3 py-2 bg-purple-500/10 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-500 hover:text-white transition flex items-center justify-center gap-2"
            >
              <EyeIcon className="w-4 h-4" /> View Product
            </Link>
          ) : (
            <button
              onClick={() => {
                if (!isDeactivated && !outOfStock) {
                  const event = new CustomEvent("add-to-cart", {
                    detail: { productId: product._id, quantity: 1 },
                  });
                  window.dispatchEvent(event);
                }
              }}
              disabled={isDeactivated || outOfStock}
              className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
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
        </div>
      </div>
    );
  };

  return (
    <section className="container-custom py-8">
      <SectionHeader title={title} subtitle={subtitle} linkTo={linkTo} />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <LoadingSkeleton type="product" count={5} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-text mb-1">Coming Soon</h3>
          <p className="text-text-light text-sm">
            Products will appear here once added
          </p>
        </div>
      ) : (
        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          navigation={{
            nextEl: ".swiper-button-next-custom",
            prevEl: ".swiper-button-prev-custom",
          }}
          slidesPerView={1.5}
          breakpoints={{
            480: { slidesPerView: 2 },
            640: { slidesPerView: 2.2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
          className="product-carousel !overflow-visible !px-1 !py-2"
          touchStartPreventDefault={false}
          touchMoveStopPropagation={false}
          simulateTouch={true}
          allowTouchMove={true}
        >
          {products.map((product) => (
            <SwiperSlide key={product._id} className="h-full">
              <CarouselProductCard product={product} />
            </SwiperSlide>
          ))}

          <div className="swiper-button-prev-custom absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary hover:text-white transition-colors duration-200 border border-gray-200 hover:border-primary">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
          <div className="swiper-button-next-custom absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary hover:text-white transition-colors duration-200 border border-gray-200 hover:border-primary">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Swiper>
      )}
    </section>
  );
};

export default ProductCarousel;
