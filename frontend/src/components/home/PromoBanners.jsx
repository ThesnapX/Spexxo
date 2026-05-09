import { Link } from "react-router-dom";

const PromoBanners = () => {
  const banners = [
    {
      id: 1,
      image: "images/promo-banner/banner1.png",
      link: "/shop/eyeglasses",
      alt: "Eyeglasses Promo",
      // Use aspectRatio for different shapes:
      // 'square' = 1/1, 'portrait' = 3/4, 'landscape' = 16/9, 'standard' = 4/3
      aspectRatio: "aspect-[4/4]", // Change this to control card shape
    },
    {
      id: 2,
      image: "images/promo-banner/banner2.png",
      link: "/shop/sunglasses",
      alt: "Sunglasses Promo",
      aspectRatio: "aspect-[4/4]", // Match all banners to same ratio
    },
    {
      id: 3,
      image: "images/promo-banner/banner3.png",
      link: "/shop/contact-lens",
      alt: "Contact Lens Promo",
      aspectRatio: "aspect-[4/4]", // Or use different ratios per banner
    },
  ];

  return (
    <section className="container-custom py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.link}
            className="block rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
          >
            <div
              className={`${banner.aspectRatio} overflow-hidden bg-gray-100`}
            >
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PromoBanners;
