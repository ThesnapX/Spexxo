import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";
import HeroSlider from "../components/home/HeroSlider";
import BentoCategoryGrid from "../components/home/BentoCategoryGrid";
import ProductCarousel from "../components/home/ProductCarousel";
import FeaturesSection from "../components/home/FeaturesSection";
import PromoBanners from "../components/home/PromoBanners";
import BrandsSection from "../components/home/BrandsSection";
import AuthPopup from "../components/common/AuthPopup";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Home = () => {
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  return (
    <>
      <SEO
        title="Premium Eyeglasses, Sunglasses & Contact Lenses"
        description="Shop the latest collection of premium eyewear at Spexxo. Free shipping, COD available, best prices on eyeglasses, sunglasses & contact lenses."
      />

      <HeroSlider />
      <BentoCategoryGrid />

      <ProductCarousel
        title="Customer Loved"
        subtitle="Most popular picks by our customers"
        queryKey="trending-products"
        apiParams={{ isTrending: true, sort: "rating" }}
        linkTo="/shop?isTrending=true"
        onRequireAuth={() => setShowAuthPopup(true)}
      />

      <FeaturesSection />
      <PromoBanners />

      <ProductCarousel
        title="Flash Sales"
        subtitle="Limited time deals, grab them fast!"
        queryKey="flash-sale-products"
        apiParams={{ isFeatured: true, sort: "price-low" }}
        linkTo="/shop?isFeatured=true"
        showSaleBadge={true}
        onRequireAuth={() => setShowAuthPopup(true)}
      />

      <ProductCarousel
        title="New Arrivals"
        subtitle="Fresh styles just landed"
        queryKey="new-arrivals-products"
        apiParams={{ isNewArrival: true, sort: "newest" }}
        linkTo="/shop?isNewArrival=true"
        onRequireAuth={() => setShowAuthPopup(true)}
      />

      <BrandsSection />

      <ProductCarousel
        title="Best Sellers"
        subtitle="Everyone's favorites"
        queryKey="bestseller-products"
        apiParams={{ isBestSeller: true, sort: "popular" }}
        linkTo="/shop?isBestSeller=true"
        onRequireAuth={() => setShowAuthPopup(true)}
      />

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        mode="login"
      />
    </>
  );
};

export default Home;
