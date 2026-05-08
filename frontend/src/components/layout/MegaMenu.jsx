import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MegaMenu = ({ type, onClose }) => {
  const { data: categories } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/categories?productType=${type}`,
      );
      return data.categories;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands;
    },
  });

  const typeLabels = {
    eyeglasses: "Eyeglasses",
    sunglasses: "Sunglasses",
    contactlens: "Contact Lenses",
  };

  return (
    <div
      className="absolute top-full left-0 mt-2 w-[700px] bg-white shadow-2xl rounded-lg p-8 grid grid-cols-3 gap-8 border border-gray-100"
      onMouseLeave={onClose}
    >
      {/* Gender Categories */}
      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">
          Shop By Gender
        </h3>
        <div className="space-y-2">
          {["men", "women", "kids"].map((gender) => (
            <Link
              key={gender}
              to={`/shop?productType=${type}&gender=${gender}`}
              className="block px-4 py-3 rounded-lg hover:bg-gray-50 transition group"
              onClick={onClose}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition">
                  <span className="text-lg">
                    {gender === "men" ? "👨" : gender === "women" ? "👩" : "👶"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-text capitalize">{gender}</p>
                  <p className="text-xs text-text-light">
                    View all {gender}'s {typeLabels[type] || type}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">
          Categories
        </h3>
        <div className="space-y-2">
          {categories?.slice(0, 6).map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?category=${cat.slug}`}
              className="block px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-primary transition text-sm text-text"
              onClick={onClose}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            to={`/shop/${type}`}
            className="block px-4 py-2 text-primary font-medium text-sm hover:underline"
            onClick={onClose}
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">
          Top Brands
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {brands?.slice(0, 6).map((brand) => (
            <Link
              key={brand._id}
              to={`/shop?brand=${brand.slug}`}
              className="block p-3 border border-gray-100 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition text-center"
              onClick={onClose}
            >
              {brand.logo?.url ? (
                <img
                  src={brand.logo.url}
                  alt={brand.name}
                  className="h-8 mx-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-text">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
        <Link
          to="/shop"
          className="block mt-4 text-primary font-medium text-sm hover:underline text-center"
          onClick={onClose}
        >
          All Brands →
        </Link>
      </div>
    </div>
  );
};

export default MegaMenu;
