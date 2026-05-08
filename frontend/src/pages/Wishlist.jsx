import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { TrashIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import SEO from "../components/common/SEO";

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <>
      <SEO title="My Wishlist" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-text">My Wishlist</h1>
            <Link
              to="/account"
              className="text-primary hover:underline text-sm"
            >
              Back to Account
            </Link>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <p className="text-6xl mb-4">❤️</p>
              <h2 className="text-xl font-semibold text-text mb-2">
                Your Wishlist is Empty
              </h2>
              <p className="text-text-light mb-6">
                Save your favorite products here
              </p>
              <Link to="/shop" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlist.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden group"
                >
                  <div className="relative">
                    <Link to={`/product/${product.slug}`}>
                      <img
                        src={
                          product.images?.[0]?.url ||
                          "/images/products/placeholder.jpg"
                        }
                        alt={product.name}
                        className="w-full h-56 object-cover"
                      />
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-medium text-sm line-clamp-1 hover:text-primary transition"
                    >
                      {product.name}
                    </Link>
                    <p className="text-primary font-semibold mt-2">
                      ₹{product.price?.toLocaleString()}
                    </p>
                    <button
                      onClick={() => addToCart(product._id, 1)}
                      className="w-full mt-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition flex items-center justify-center gap-2"
                    >
                      <ShoppingBagIcon className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;
