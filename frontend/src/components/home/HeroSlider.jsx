import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const HeroSlider = () => {
  const heroSlides = [
    {
      id: 1,
      image: "images/hero-banner/eyeglass.png",
      link: "/shop/eyeglasses",
      alt: "Eyeglasses Collection",
      // mobileImage: "images/hero-banner/eyeglass-mobile.png", // Optional: mobile specific
    },
    {
      id: 2,
      image: "images/hero-banner/sunglasses.png",
      link: "/shop/sunglasses",
      alt: "Sunglasses Collection",
    },
    {
      id: 3,
      image: "images/hero-banner/eyewear.png",
      link: "/shop",
      alt: "All Collection",
    },
  ];

  return (
    <section className="pt-2 pb-4 md:pt-4 md:pb-6">
      <div className="container-custom">
        <div className="hero-slider-wrapper relative">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            className="hero-slider rounded-2xl md:rounded-3xl overflow-hidden"
            id="heroSwiper"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <a href={slide.link} className="block">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] object-cover"
                    loading="eager"
                  />
                </a>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Left Arrow */}
          <button
            onClick={() => {
              const swiper = document.querySelector("#heroSwiper")?.swiper;
              if (swiper) swiper.slidePrev();
            }}
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 group"
            aria-label="Previous slide"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 bg-white/80 rounded-full flex items-center justify-center shadow-md transition-all duration-200 group-hover:bg-white group-hover:shadow-lg group-active:scale-90">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-gray-700"
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
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => {
              const swiper = document.querySelector("#heroSwiper")?.swiper;
              if (swiper) swiper.slideNext();
            }}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 group"
            aria-label="Next slide"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 bg-white/80 rounded-full flex items-center justify-center shadow-md transition-all duration-200 group-hover:bg-white group-hover:shadow-lg group-active:scale-90">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-gray-700"
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
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
