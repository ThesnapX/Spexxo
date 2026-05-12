import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import SectionHeader from "../common/SectionHeader";
import ProductCard from "../common/ProductCard";
import LoadingSkeleton from "../common/LoadingSkeleton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProductCarousel = ({
  title,
  subtitle,
  queryKey,
  apiParams,
  linkTo,
  showSaleBadge = false,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      try {
        const queryString = new URLSearchParams({
          limit: 10,
          ...apiParams,
        }).toString();
        const { data } = await axios.get(`${API_URL}/products?${queryString}`);
        return data.products || [];
      } catch {
        return [];
      }
    },
  });

  const products = data || [];

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
          navigation
          slidesPerView={1.5}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
          className="product-carousel !overflow-visible !px-1 !py-2"
        >
          {products.map((product) => (
            <SwiperSlide key={product._id}>
              <ProductCard product={product} showSaleBadge={showSaleBadge} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};

export default ProductCarousel;
