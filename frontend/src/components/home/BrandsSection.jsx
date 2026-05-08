import { Link } from "react-router-dom";
import SectionHeader from "../common/SectionHeader";

const brandImages = [
  { name: "Burberry", image: "/brands/burberry.png", slug: "burberry" },
  { name: "Carerra", image: "/brands/carerra.png", slug: "carerra" },
  { name: "Crizal", image: "/brands/crizal.png", slug: "crizal" },
  { name: "Fasttrack", image: "/brands/fasttrack.png", slug: "fasttrack" },
  { name: "Gucci", image: "/brands/gucci.png", slug: "gucci" },
  { name: "Hugo Boss", image: "/brands/hugo-boss.png", slug: "hugo-boss" },
  {
    name: "John Jacobs",
    image: "/brands/john-jacobs.png",
    slug: "john-jacobs",
  },
  { name: "Montblanc", image: "/brands/montblanc.png", slug: "montblanc" },
  { name: "Police", image: "/brands/police.png", slug: "police" },
  { name: "Prada", image: "/brands/prada.png", slug: "prada" },
  { name: "Ray-Ban", image: "/brands/ray-ban.png", slug: "ray-ban" },
  { name: "Tom Ford", image: "/brands/tom-ford.png", slug: "tom-ford" },
];

const BrandsSection = () => {
  if (!brandImages || brandImages.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        <SectionHeader
          title="Top Brands"
          linkTo="/shop"
          linkText="View All Brands"
        />

        {/* Desktop Grid - 6 Columns */}
        <div className="hidden sm:grid grid-cols-6 gap-0">
          {brandImages.map((brand, index) => (
            <Link
              key={index}
              to={`/shop?brand=${brand.slug}`}
              className="group flex items-center justify-center py-6 md:py-8 lg:py-10"
              title={brand.name}
            >
              <img
                src={brand.image}
                alt={brand.name}
                className="w-full max-w-[120px] md:max-w-[140px] lg:max-w-[160px] h-auto object-contain opacity-50 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </Link>
          ))}
        </div>

        {/* Second Row - Empty if needed for spacing */}
        <div className="hidden sm:block h-0"></div>

        {/* Mobile Grid - 3 Columns */}
        <div className="sm:hidden grid grid-cols-3 gap-0">
          {brandImages.map((brand, index) => (
            <Link
              key={index}
              to={`/shop?brand=${brand.slug}`}
              className="group flex items-center justify-center py-5"
              title={brand.name}
            >
              <img
                src={brand.image}
                alt={brand.name}
                className="w-full max-w-[90px] h-auto object-contain opacity-50 group-active:opacity-100 transition-all duration-300 group-active:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
