// frontend/src/pages/Home.jsx

import { useState, useEffect } from "react";
import SEO from "../components/common/SEO";
import HeroSlider from "../components/home/HeroSlider";
import BentoCategoryGrid from "../components/home/BentoCategoryGrid";
import ProductCarousel from "../components/home/ProductCarousel";
import FeaturesSection from "../components/home/FeaturesSection";
import PromoBanners from "../components/home/PromoBanners";
import BrandsSection from "../components/home/BrandsSection";
import AuthPopup from "../components/common/AuthPopup";

const Home = () => {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [carouselsLoaded, setCarouselsLoaded] = useState({
    trending: false,
    flash: false,
    newArrivals: false,
    bestSellers: false,
  });

  // ✅ Load carousels with delay to avoid 429 errors
  useEffect(() => {
    const loadCarousels = () => {
      // Load first carousel immediately
      setCarouselsLoaded((prev) => ({ ...prev, trending: true }));

      // Load others with delay
      setTimeout(
        () => setCarouselsLoaded((prev) => ({ ...prev, flash: true })),
        1500,
      );
      setTimeout(
        () => setCarouselsLoaded((prev) => ({ ...prev, newArrivals: true })),
        3000,
      );
      setTimeout(
        () => setCarouselsLoaded((prev) => ({ ...prev, bestSellers: true })),
        4500,
      );
    };

    loadCarousels();
  }, []);

  return (
    <>
      <SEO
        title="Premium Eyeglasses, Sunglasses & Contact Lenses"
        description="Shop the latest collection of premium eyewear at Spexxo. Free shipping, COD available, best prices on eyeglasses, sunglasses & contact lenses."
      />

      <HeroSlider />
      <BentoCategoryGrid />

      {carouselsLoaded.trending && (
        <ProductCarousel
          title="Customer Loved"
          subtitle="Most popular picks by our customers"
          queryKey="trending-products"
          apiParams={{ isTrending: true, sort: "rating" }}
          linkTo="/shop?isTrending=true"
          showSaleBadge={true}
          onRequireAuth={() => setShowAuthPopup(true)}
        />
      )}

      <FeaturesSection />
      <PromoBanners />

      {carouselsLoaded.flash && (
        <ProductCarousel
          title="Flash Sales"
          subtitle="Limited time deals, grab them fast!"
          queryKey="flash-sale-products"
          apiParams={{ isFeatured: true, sort: "price-low" }}
          linkTo="/shop?isFeatured=true"
          showSaleBadge={true}
          onRequireAuth={() => setShowAuthPopup(true)}
        />
      )}

      {carouselsLoaded.newArrivals && (
        <ProductCarousel
          title="New Arrivals"
          subtitle="Fresh styles just landed"
          queryKey="new-arrivals-products"
          apiParams={{ isNewArrival: true, sort: "newest" }}
          linkTo="/shop?isNewArrival=true"
          showSaleBadge={true}
          onRequireAuth={() => setShowAuthPopup(true)}
        />
      )}

      <BrandsSection />

      {carouselsLoaded.bestSellers && (
        <ProductCarousel
          title="Best Sellers"
          subtitle="Everyone's favorites"
          queryKey="bestseller-products"
          apiParams={{ isBestSeller: true, sort: "popular" }}
          linkTo="/shop?isBestSeller=true"
          showSaleBadge={true}
          onRequireAuth={() => setShowAuthPopup(true)}
        />
      )}

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        mode="login"
      />
    </>
  );
};

export default Home;
