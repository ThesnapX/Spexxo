import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";
import HeroSlider from "../components/home/HeroSlider";
import BentoCategoryGrid from "../components/home/BentoCategoryGrid";
import ProductCarousel from "../components/home/ProductCarousel";
import FeaturesSection from "../components/home/FeaturesSection";
import PromoBanners from "../components/home/PromoBanners";
import BrandsSection from "../components/home/BrandsSection";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Home = () => {
  // You can add homepage-specific data fetching here if needed
  // Like featured banners from backend, popup data, etc.

  return (
    <>
      <SEO
        title="Premium Eyeglasses, Sunglasses & Contact Lenses"
        description="Shop the latest collection of premium eyewear at Spexxo. Free shipping, COD available, best prices on eyeglasses, sunglasses & contact lenses."
      />

      {/* 1. Hero Slider */}
      <HeroSlider />

      {/* 2. Bento Category Grid */}
      <BentoCategoryGrid />

      {/* 3. Customer Loved Products */}
      <ProductCarousel
        title="Customer Loved"
        subtitle="Most popular picks by our customers"
        queryKey="trending-products"
        apiParams={{ isTrending: true, sort: "rating" }}
        linkTo="/shop?isTrending=true"
      />

      {/* 4. Features Section */}
      <FeaturesSection />

      {/* 5. Three Banner Section */}
      <PromoBanners />

      {/* 6. Flash Sales */}
      <ProductCarousel
        title="Flash Sales"
        subtitle="Limited time deals, grab them fast!"
        queryKey="flash-sale-products"
        apiParams={{ isFeatured: true, sort: "price-low" }}
        linkTo="/shop?isFeatured=true"
        showSaleBadge={true}
      />

      {/* 7. New Arrivals */}
      <ProductCarousel
        title="New Arrivals"
        subtitle="Fresh styles just landed"
        queryKey="new-arrivals-products"
        apiParams={{ isNewArrival: true, sort: "newest" }}
        linkTo="/shop?isNewArrival=true"
      />

      {/* 8. Brands Section */}
      <BrandsSection />

      {/* 9. Best Sellers */}
      <ProductCarousel
        title="Best Sellers"
        subtitle="Everyone's favorites"
        queryKey="bestseller-products"
        apiParams={{ isBestSeller: true, sort: "popular" }}
        linkTo="/shop?isBestSeller=true"
      />
    </>
  );
};

export default Home;
