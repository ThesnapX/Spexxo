import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  HeartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import LiveSearch from "../common/LiveSearch";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const megaMenuTimeout = useRef(null);
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     navigate(`/shop?search=${searchQuery}`);
  //     setSearchQuery("");
  //     setMobileSearchOpen(false);
  //   }
  // };

  const handleMegaMenuEnter = (menu) => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    setActiveMegaMenu(menu);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeout.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 200);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-text text-white text-sm py-2 hidden md:block">
        <div className="container-custom flex justify-between items-center">
          <p>Free Shipping on orders above ₹999 | COD Available</p>
          <div className="flex gap-4">
            <Link
              to="/account/orders"
              className="hover:text-primary-light transition"
            >
              Track Order
            </Link>
            <Link to="/faq" className="hover:text-primary-light transition">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-lg" : "bg-white"}`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between py-3 gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/images/logo.png"
                alt="Spexxo"
                className="h-8 md:h-10 w-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="hidden text-xl md:text-2xl font-bold text-text">
                Spe<span className="text-primary">xx</span>o
              </span>
            </Link>

            {/* Desktop Navigation + Search */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
              {/* Live Search */}
              <LiveSearch
                className="w-full max-w-lg"
                placeholder="Search for eyeglasses, sunglasses, contact lenses..."
              />

              {/* Nav Links */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Eyeglasses */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter("eyeglasses")}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <NavLink
                    to="/shop/eyeglasses"
                    className={({ isActive }) =>
                      `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "text-[#3D96EB] bg-[#EBF4FC]"
                          : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                      }`
                    }
                  >
                    Eyeglasses
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </NavLink>
                </div>

                {/* Sunglasses */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter("sunglasses")}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <NavLink
                    to="/shop/sunglasses"
                    className={({ isActive }) =>
                      `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "text-[#3D96EB] bg-[#EBF4FC]"
                          : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                      }`
                    }
                  >
                    Sunglasses
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </NavLink>
                </div>

                {/* Contact Lens */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter("contactlens")}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <NavLink
                    to="/shop/contact-lens"
                    className={({ isActive }) =>
                      `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "text-[#3D96EB] bg-[#EBF4FC]"
                          : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                      }`
                    }
                  >
                    Contact Lens
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </NavLink>
                </div>

                {/* Contact Us */}
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-[#3D96EB] bg-[#EBF4FC]"
                        : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                    }`
                  }
                >
                  Contact Us
                </NavLink>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden text-text hover:text-[#3D96EB]"
              >
                <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              {/* Wishlist */}
              <Link
                to="/account/wishlist"
                className="relative text-text hover:text-[#3D96EB] transition"
              >
                <HeartIcon className="w-5 h-5 md:w-6 md:h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#3D96EB] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative text-text hover:text-[#3D96EB] transition"
              >
                <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#3D96EB] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                to={isAuthenticated ? "/account" : "/login"}
                className="text-text hover:text-[#3D96EB] transition"
              >
                <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-text"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 md:w-7 md:h-7" />
                ) : (
                  <Bars3Icon className="w-6 h-6 md:w-7 md:h-7" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu Panel */}
        {activeMegaMenu && (
          <div
            className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-100 z-50"
            onMouseEnter={() => {
              if (megaMenuTimeout.current)
                clearTimeout(megaMenuTimeout.current);
            }}
            onMouseLeave={handleMegaMenuLeave}
          >
            <div className="container-custom py-8">
              <MegaMenuContent
                type={activeMegaMenu}
                onClose={() => setActiveMegaMenu(null)}
              />
            </div>
          </div>
        )}

        {/* Mobile Search Bar */}
        {/* {mobileSearchOpen && (
          <div className="lg:hidden border-t bg-white px-4 py-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center relative"
            >
              <input
                type="text"
                placeholder="Search for eyewear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#3D96EB]"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#3D96EB] text-white p-1.5 rounded-full"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        )} */}

        {/* Mobile Search */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t bg-white px-4 py-3">
            <LiveSearch placeholder="Search eyewear..." />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t max-h-[70vh] overflow-y-auto">
            <div className="container-custom py-4 space-y-1">
              <MobileMenuLink
                to="/shop/eyeglasses"
                onClick={() => setMobileMenuOpen(false)}
              >
                Eyeglasses
              </MobileMenuLink>
              <MobileMenuLink
                to="/shop/sunglasses"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sunglasses
              </MobileMenuLink>
              <MobileMenuLink
                to="/shop/contact-lens"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Lens
              </MobileMenuLink>
              <div className="border-t my-3"></div>
              <MobileMenuLink
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </MobileMenuLink>
              <MobileMenuLink
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </MobileMenuLink>
              <MobileMenuLink
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </MobileMenuLink>
              <MobileMenuLink
                to="/faq"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </MobileMenuLink>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[56px] md:h-[64px]"></div>
    </>
  );
};

// Mobile Menu Link Component
const MobileMenuLink = ({ to, onClick, children }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `block px-4 py-3 rounded-lg text-base font-medium transition ${
        isActive
          ? "text-[#3D96EB] bg-[#EBF4FC]"
          : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
      }`
    }
  >
    {children}
  </NavLink>
);

// Mega Menu Content Component
const MegaMenuContent = ({ type, onClose }) => {
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
    <div className="grid grid-cols-12 gap-8">
      {/* Shop by Gender */}
      <div className="col-span-4">
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4 tracking-wider">
          Shop {typeLabels[type]} by Gender
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {["men", "women", "kids"].map((gender) => (
            <Link
              key={gender}
              to={`/shop?productType=${type}&gender=${gender}`}
              className="group text-center"
              onClick={onClose}
            >
              <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-[#3D96EB] transition-all">
                <img
                  src={`https://picsum.photos/400/533?random=${type}-${gender}`}
                  alt={gender}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-${gender === "men" ? "blue" : gender === "women" ? "pink" : "green"}-100 to-${gender === "men" ? "blue" : gender === "women" ? "pink" : "green"}-200 flex items-center justify-center">
                        <span class="text-4xl">${gender === "men" ? "👨" : gender === "women" ? "👩" : "👶"}</span>
                      </div>
                    `;
                  }}
                />
              </div>
              <p className="text-sm font-medium text-text group-hover:text-[#3D96EB] transition capitalize">
                {gender}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="col-span-3 border-l border-gray-100 pl-8">
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4 tracking-wider">
          Categories
        </h3>
        <div className="space-y-2">
          {categories?.length > 0 ? (
            categories.slice(0, 6).map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat.slug}`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                {cat.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-3 py-2">No categories yet</p>
          )}
          <Link
            to={`/shop/${type}`}
            onClick={onClose}
            className="block px-3 py-2 text-[#3D96EB] font-medium text-sm hover:underline mt-2"
          >
            View All {typeLabels[type]} →
          </Link>
        </div>
      </div>

      {/* Frame Shape */}
      <div className="col-span-3 border-l border-gray-100 pl-8">
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4 tracking-wider">
          Frame Shape
        </h3>
        <div className="space-y-2">
          {type !== "contactlens" ? (
            [
              "Rectangle",
              "Round",
              "Cat Eye",
              "Square",
              "Aviator",
              "Wayfarer",
            ].map((shape) => (
              <Link
                key={shape}
                to={`/shop?productType=${type}&frameShape=${shape.toLowerCase().replace(" ", "-")}`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                {shape}
              </Link>
            ))
          ) : (
            <>
              <Link
                to={`/shop?productType=contactlens`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                Daily Disposable
              </Link>
              <Link
                to={`/shop?productType=contactlens`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                Monthly Lenses
              </Link>
              <Link
                to={`/shop?productType=contactlens`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                Colored Lenses
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Brands */}
      <div className="col-span-2 border-l border-gray-100 pl-8">
        <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4 tracking-wider">
          Top Brands
        </h3>
        <div className="space-y-2">
          {brands?.length > 0 ? (
            brands.slice(0, 5).map((brand) => (
              <Link
                key={brand._id}
                to={`/shop?brand=${brand.slug}`}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                {brand.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-3 py-2">No brands yet</p>
          )}
          <Link
            to="/shop"
            onClick={onClose}
            className="block px-3 py-2 text-[#3D96EB] font-medium text-sm hover:underline mt-2"
          >
            All Brands →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
