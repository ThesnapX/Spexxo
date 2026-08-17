import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import SEO from "../components/common/SEO";
import ProductCard from "../components/common/ProductCard";

const Wishlist = () => {
  const { wishlist } = useWishlist();

  // Filter out deactivated products
  const activeWishlist = wishlist.filter(
    (product) => product.isActive !== false,
  );

  return (
    <>
      <SEO title="My Wishlist" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text">
                My Wishlist
              </h1>
              <p className="text-text-light text-sm mt-1">
                {activeWishlist.length}{" "}
                {activeWishlist.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            <Link to="/shop" className="btn-outline text-sm">
              Browse Products
            </Link>
          </div>

          {activeWishlist.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-6xl mb-4">❤️</p>
              <h2 className="text-xl font-semibold text-text mb-2">
                Your Wishlist is Empty
              </h2>
              <p className="text-text-light mb-6">
                Save your favorite products here by clicking the heart icon
              </p>
              <Link to="/shop" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {activeWishlist.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showSaleBadge={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
