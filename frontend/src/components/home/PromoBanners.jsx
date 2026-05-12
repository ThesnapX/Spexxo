import { Link } from "react-router-dom";

const PromoBanners = () => {
  const banners = [
    {
      id: 1,
      image: "images/promo-banner/banner1.png",
      link: "/shop/eyeglasses",
      alt: "Eyeglasses Promo",
    },
    {
      id: 2,
      image: "images/promo-banner/banner2.png",
      link: "/shop/sunglasses",
      alt: "Sunglasses Promo",
    },
    {
      id: 3,
      image: "images/promo-banner/banner3.png",
      link: "/shop/contact-lens",
      alt: "Contact Lens Promo",
    },
  ];

  return (
    <section className="container-custom py-8">
      {/* Mobile: 1 col | Tablet: 2 cols | Desktop: 3 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {banners.map((banner) => (
          <Link
            key={banner.id}
            to={banner.link}
            className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src={banner.image}
                alt={banner.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
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
