// frontend/src/pages/Home.jsx

import { useState, useEffect } from "react";
import SEO from "../components/common/SEO";
import HeroSlider from "../components/home/HeroSlider";
import BentoCategoryGrid from "../components/home/BentoCategoryGrid";
import ProductCarousel from "../components/home/ProductCarousel";
import FeaturesSection from "../components/home/FeaturesSection";
import PromoBanners from "../components/home/PromoBanners";
import BrandsSection from "../components/home/BrandsSection";
import BlogSection from "../components/home/BlogSection";
import AuthPopup from "../components/common/AuthPopup";

const Home = () => {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [carouselsLoaded, setCarouselsLoaded] = useState({
    trending: false,
    flash: false,
    newArrivals: false,
    bestSellers: false,
  });

  useEffect(() => {
    const loadCarousels = () => {
      setCarouselsLoaded((prev) => ({ ...prev, trending: true }));
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
        title="Premium Eyeglasses, Sunglasses & Contact Lenses Online"
        description="Shop premium eyeglasses, sunglasses & contact lenses online at Spexxo. Best prices, COD available, free shipping on orders above ₹999."
        canonicalUrl="https://spexxo.vercel.app/"
        ogType="website"
      />

      {/* ✅ Crawlable H1 for SEO — visible to users and Googlebot */}
      <section className="container-custom pt-6 pb-2 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-text">
          Spexxo — Premium Eyeglasses, Sunglasses & Contact Lenses
        </h1>
        <p className="text-text-light text-sm md:text-base mt-3 max-w-3xl mx-auto">
          Buy premium eyewear online at Spexxo. Browse eyeglasses, sunglasses
          and contact lenses from top brands. Prescription-ready frames, UV400
          protection, and free shipping on orders above ₹999 across India.
        </p>
      </section>

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
          apiParams={{ hasDiscount: true, sort: "price-low" }}
          linkTo="/shop?sort=price-low"
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

      <BlogSection />

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        mode="login"
      />
    </>
  );
};

export default Home;
