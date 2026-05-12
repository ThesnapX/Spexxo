import { Link } from "react-router-dom";

const categoryData = [
  {
    name: "Shop By Gender",
    image: "images/bento-cards/shop-by-gender.png",
    link: "/shop",
  },
  {
    name: "Explore Collection",
    image: "images/bento-cards/explore-collections.png",
    link: "/shop",
  },
  {
    name: "Blue Cut Glasses",
    image: "images/bento-cards/blue-cut.png",
    link: "/shop?lensType=blue-cut",
  },
  {
    name: "Polarized Glasses",
    image: "images/bento-cards/polarized.png",
    link: "/shop?lensType=polarized",
  },
  {
    name: "Scratch Resistant",
    image: "images/bento-cards/scratch-resistent.png",
    link: "/shop?frameMaterial=titanium",
  },
  {
    name: "UV Protection",
    image: "images/bento-cards/uv-protection.png",
    link: "/shop/sunglasses",
  },
];

const BentoCategoryGrid = () => {
  if (!categoryData || categoryData.length === 0) return null;

  return (
    <section className="container-custom py-6 md:py-8">
      {/* ============ MOBILE ONLY ============ */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Card 1 - Square 1:1 full width */}
        <Link
          to={categoryData[0].link}
          className="block w-full aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <img
            src={categoryData[0].image}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Card 2 - Full width */}
        <Link
          to={categoryData[1].link}
          className="block w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <img
            src={categoryData[1].image}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Cards 3-6 - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {categoryData.slice(2, 6).map((card, i) => (
            <Link
              key={i}
              to={card.link}
              className="block w-full aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <img
                src={card.image}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* ============ TABLET & DESKTOP ============ */}
      <div className="hidden md:grid md:grid-cols-5 gap-3 lg:gap-4">
        {/* Card 1 - 2 cols × 4 rows */}
        <Link
          to={categoryData[0].link}
          className="block col-span-2 row-span-4 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <img
            src={categoryData[0].image}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Card 2 - 1 col × 4 rows (Full height) */}
        <Link
          to={categoryData[1].link}
          className="block col-span-1 row-span-4 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <img
            src={categoryData[1].image}
            alt=""
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Cards 3-6 - Each 1 col × 2 rows */}
        {categoryData.slice(2, 6).map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className="block col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          >
            <img
              src={card.image}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BentoCategoryGrid;
