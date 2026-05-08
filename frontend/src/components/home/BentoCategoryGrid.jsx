import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import LoadingSkeleton from "../common/LoadingSkeleton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BentoCategoryGrid = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-home"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/categories`);
        return data.categories?.slice(0, 6) || [];
      } catch {
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <section className="container-custom py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <LoadingSkeleton type="category" count={6} />
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null; // Don't show section if no categories
  }

  // Bento grid layout
  const gridLayout = [
    "md:col-span-1 md:row-span-2", // Large item
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
  ];

  return (
    <section className="container-custom py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[150px] md:auto-rows-[180px]">
        {categories.slice(0, 6).map((category, index) => (
          <Link
            key={category._id}
            to={`/shop?category=${category.slug}`}
            className={`group relative rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              index === 0 ? "md:col-span-1 md:row-span-2" : ""
            }`}
          >
            {category.image?.url ? (
              <img
                src={category.image.url}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-4xl md:text-5xl opacity-30">
                  {index === 0
                    ? "👓"
                    : index === 1
                      ? "🕶️"
                      : index === 2
                        ? "👩"
                        : index === 3
                          ? "👨"
                          : index === 4
                            ? "👶"
                            : "🔵"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
              <h3 className="text-white font-semibold text-sm md:text-base">
                {category.name}
              </h3>
              <p className="text-white/70 text-xs mt-1">Shop Now →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BentoCategoryGrid;
