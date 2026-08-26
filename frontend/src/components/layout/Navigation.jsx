import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
  PhoneIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
  EyeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import LiveSearch from "../common/LiveSearch";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [showDeactivatedWarning, setShowDeactivatedWarning] = useState(false);
  const megaMenuTimeout = useRef(null);
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { cart, activeCartCount, removeFromCart } = useCart();
  const { wishlist } = useWishlist();

  // Check for deactivated products in cart
  const deactivatedInCart =
    cart?.items?.filter((item) => item.product?.isActive === false) || [];

  // Calculate active wishlist count (only active products)
  const activeWishlistCount =
    wishlist?.filter((product) => product?.isActive !== false).length || 0;

  useEffect(() => {
    if (deactivatedInCart.length > 0) {
      setShowDeactivatedWarning(true);
    } else {
      setShowDeactivatedWarning(false);
    }
  }, [cart]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMegaMenuEnter = (menu) => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    setActiveMegaMenu(menu);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeout.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 200);
  };

  const handleRemoveDeactivated = async () => {
    for (const item of deactivatedInCart) {
      await removeFromCart(item._id);
    }
    toast.success("All deactivated products removed from cart");
  };

  // Get current filters from URL
  const params = new URLSearchParams(location.search);
  const currentProductCategory = params.get("productCategory") || "";
  const currentFrameShape = params.get("frameShape") || "";
  const currentCategory = params.get("category") || "";
  const currentBrand = params.get("brand") || "";
  const currentGender = params.get("gender") || "";

  const getActiveMegaType = () => {
    if (location.pathname === "/shop/eyeglasses") return "eyeglasses";
    if (location.pathname === "/shop/sunglasses") return "sunglasses";
    if (location.pathname === "/shop/contact-lens") return "contactlens";
    if (currentProductCategory === "eyeglasses") return "eyeglasses";
    if (currentProductCategory === "sunglasses") return "sunglasses";
    if (currentProductCategory === "contactlens") return "contactlens";
    return "";
  };

  const activeMegaType = getActiveMegaType();
  const isShopActive = location.pathname === "/shop" && !activeMegaType;

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-lg" : "bg-white"
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between py-3 gap-4">
            <Link to="/" className="flex-shrink-0">
              <img
                src="/images/logo-black.png"
                alt="Spexxo"
                className="h-8 md:h-12 w-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="hidden text-xl md:text-2xl font-bold text-text">
                Spe<span className="text-primary">xx</span>o
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-3 flex-1 justify-center">
              <LiveSearch
                className="w-full max-w-lg"
                placeholder="Search for eyeglasses, sunglasses, contact lenses..."
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <NavLink
                  to="/shop"
                  end
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isShopActive
                      ? "text-[#3D96EB] bg-[#EBF4FC]"
                      : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                  }`}
                >
                  Shop
                </NavLink>

                <div
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter("eyeglasses")}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <NavLink
                    to="/shop/eyeglasses"
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeMegaType === "eyeglasses"
                        ? "text-[#3D96EB] bg-[#EBF4FC]"
                        : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                    }`}
                  >
                    Eyeglasses
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </NavLink>
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter("sunglasses")}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <NavLink
                    to="/shop/sunglasses"
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeMegaType === "sunglasses"
                        ? "text-[#3D96EB] bg-[#EBF4FC]"
                        : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                    }`}
                  >
                    Sunglasses
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </NavLink>
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter("contactlens")}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <NavLink
                    to="/shop/contact-lens"
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeMegaType === "contactlens"
                        ? "text-[#3D96EB] bg-[#EBF4FC]"
                        : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
                    }`}
                  >
                    Contact Lens
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  </NavLink>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden text-text hover:text-[#3D96EB]"
              >
                <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              {/* Wishlist - Only count active products */}
              <Link
                to="/account/wishlist"
                className="relative text-text hover:text-[#3D96EB] transition"
              >
                <HeartIcon className="w-5 h-5 md:w-6 md:h-6" />
                {activeWishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#3D96EB] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeWishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                onClick={() => {
                  // Silently refresh cart when user clicks cart icon
                  refreshCart();
                }}
                className="relative text-text hover:text-[#3D96EB] transition"
              >
                <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6" />
                {activeCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#3D96EB] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeCartCount}
                  </span>
                )}
                {showDeactivatedWarning && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </Link>
              <Link
                to={isAuthenticated ? "/account" : "/login"}
                className="text-text hover:text-[#3D96EB] transition"
              >
                <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
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

        {/* Deactivated Products Warning Bar */}
        {showDeactivatedWarning && (
          <div className="bg-red-50 border-b border-red-200 py-2 px-4">
            <div className="container-custom flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span>
                  <strong>{deactivatedInCart.length}</strong> deactivated
                  {deactivatedInCart.length === 1 ? " product" : " products"} in
                  your cart
                </span>
                <span className="text-xs text-red-600 hidden sm:inline">
                  - These products are no longer available for purchase
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/cart"
                  className="text-xs text-red-700 font-medium hover:underline"
                >
                  View Cart →
                </Link>
                <button
                  onClick={handleRemoveDeactivated}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transition"
                >
                  Remove All
                </button>
              </div>
            </div>
          </div>
        )}

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

        {mobileSearchOpen && (
          <div className="lg:hidden border-t bg-white px-4 py-3">
            <LiveSearch placeholder="Search eyewear..." />
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t max-h-[70vh] overflow-y-auto">
            <div className="container-custom py-4 space-y-1">
              <MobileMenuLink
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCartIcon className="w-5 h-5" /> Shop
              </MobileMenuLink>
              <MobileMenuLink
                to="/shop/eyeglasses"
                onClick={() => setMobileMenuOpen(false)}
              >
                <EyeIcon className="w-5 h-5" /> Eyeglasses
              </MobileMenuLink>
              <MobileMenuLink
                to="/shop/sunglasses"
                onClick={() => setMobileMenuOpen(false)}
              >
                <EyeIcon className="w-5 h-5" /> Sunglasses
              </MobileMenuLink>
              <MobileMenuLink
                to="/shop/contact-lens"
                onClick={() => setMobileMenuOpen(false)}
              >
                <EyeIcon className="w-5 h-5" /> Contact Lens
              </MobileMenuLink>
              <div className="border-t my-3"></div>
              <MobileMenuLink
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
              >
                <PhoneIcon className="w-5 h-5" /> Contact Us
              </MobileMenuLink>
              <MobileMenuLink
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
              >
                <InformationCircleIcon className="w-5 h-5" /> About Us
              </MobileMenuLink>
              <MobileMenuLink
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
              >
                <DocumentTextIcon className="w-5 h-5" /> Blog
              </MobileMenuLink>
              <MobileMenuLink
                to="/faq"
                onClick={() => setMobileMenuOpen(false)}
              >
                <QuestionMarkCircleIcon className="w-5 h-5" /> FAQ
              </MobileMenuLink>
            </div>
          </div>
        )}
      </header>

      <div className="h-[56px] md:h-[64px]"></div>
    </>
  );
};

const MobileMenuLink = ({ to, onClick, children }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition ${
        isActive
          ? "text-[#3D96EB] bg-[#EBF4FC]"
          : "text-text hover:text-[#3D96EB] hover:bg-gray-50"
      }`
    }
  >
    {children}
  </NavLink>
);

// Mega Menu Content (keep the same)
const MegaMenuContent = ({ type, onClose }) => {
  // ... (same as before)
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const currentProductType = urlParams.get("productType") || "";
  const currentFrameShape = urlParams.get("frameShape") || "";
  const currentCategory = urlParams.get("category") || "";
  const currentBrand = urlParams.get("brand") || "";
  const currentGender = urlParams.get("gender") || "";

  const { data: categories } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/categories?productType=${type}`,
      );
      return data.categories || [];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/brands`);
      return data.brands || [];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["mega-menu-products", type],
    queryFn: async () => {
      const typeMap = {
        eyeglasses: "eyeglasses",
        sunglasses: "sunglasses",
        contactlens: "contactlens",
      };
      const productTypeValue = typeMap[type] || type;
      const { data } = await axios.get(
        `${API_URL}/products?productType=${productTypeValue}&limit=200`,
      );
      return data.products || [];
    },
  });

  const products = productsData || [];

  const availableCategoryIds = new Set();
  products.forEach((product) => {
    if (product.category) {
      if (typeof product.category === "string") {
        product.category
          .split(",")
          .filter(Boolean)
          .forEach((id) => availableCategoryIds.add(id));
      } else if (typeof product.category === "object" && product.category._id) {
        availableCategoryIds.add(product.category._id);
      }
    }
  });

  const availableShapes = new Set();
  products.forEach((product) => {
    if (product.frameShape) {
      if (typeof product.frameShape === "string") {
        product.frameShape
          .split(",")
          .filter(Boolean)
          .forEach((s) => availableShapes.add(s.trim()));
      }
    }
  });

  const availableBrandIds = new Set();
  products.forEach((product) => {
    if (product.brand) {
      if (typeof product.brand === "object" && product.brand._id) {
        availableBrandIds.add(product.brand._id);
      } else if (typeof product.brand === "string") {
        availableBrandIds.add(product.brand);
      }
    }
  });

  const categoriesWithProducts = (categories || []).filter((cat) =>
    availableCategoryIds.has(cat._id),
  );

  const brandsWithProducts = (brands || []).filter((brand) =>
    availableBrandIds.has(brand._id),
  );

  const allShapes = [
    "Rectangle",
    "Round",
    "Cat Eye",
    "Square",
    "Aviator",
    "Wayfarer",
    "Rimless",
    "Oversized",
  ];

  const shapesWithProducts = allShapes.filter((shape) =>
    availableShapes.has(shape),
  );

  const typeLabels = {
    eyeglasses: "Eyeglasses",
    sunglasses: "Sunglasses",
    contactlens: "Contact Lenses",
  };
  const typeMap = {
    eyeglasses: "eyeglasses",
    sunglasses: "sunglasses",
    contactlens: "contactlens",
  };
  const myProductType = typeMap[type] || type;

  const isMyMenuActive = () => {
    if (currentProductType && currentProductType === myProductType) return true;
    if (!currentProductType) {
      if (type === "eyeglasses" && location.pathname === "/shop/eyeglasses")
        return true;
      if (type === "sunglasses" && location.pathname === "/shop/sunglasses")
        return true;
      if (type === "contactlens" && location.pathname === "/shop/contact-lens")
        return true;
    }
    return false;
  };

  const isActiveShape = (shape) =>
    isMyMenuActive() &&
    currentFrameShape === shape.toLowerCase().replace(" ", "-");
  const isActiveCategory = (slug) =>
    isMyMenuActive() && currentCategory === slug;
  const isActiveBrand = (slug) => isMyMenuActive() && currentBrand === slug;
  const isActiveGender = (gender) =>
    isMyMenuActive() && currentGender === gender;

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
              <div
                className={`aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-2 border-2 transition-all ${
                  isActiveGender(gender)
                    ? "border-[#3D96EB] ring-2 ring-[#3D96EB]/20"
                    : "border-transparent group-hover:border-[#3D96EB]"
                }`}
              >
                <img
                  src={`/images/mega-menu/${type}-${gender}.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>`;
                  }}
                />
              </div>
              <p
                className={`text-sm font-medium transition capitalize ${
                  isActiveGender(gender)
                    ? "text-[#3D96EB]"
                    : "text-text group-hover:text-[#3D96EB]"
                }`}
              >
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
        <div className="space-y-1">
          {categoriesWithProducts.length > 0 ? (
            categoriesWithProducts.slice(0, 6).map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat.slug}`}
                onClick={onClose}
                className={`block px-3 py-2 rounded-lg transition text-sm ${
                  isActiveCategory(cat.slug)
                    ? "bg-[#EBF4FC] text-[#3D96EB] font-medium"
                    : "text-text hover:bg-[#EBF4FC] hover:text-[#3D96EB]"
                }`}
              >
                {cat.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-3 py-2">
              No categories with products
            </p>
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
        <div className="space-y-1">
          {type !== "contactlens" ? (
            shapesWithProducts.length > 0 ? (
              shapesWithProducts.map((shape) => {
                const shapeSlug = shape.toLowerCase().replace(" ", "-");
                return (
                  <Link
                    key={shape}
                    to={`/shop?productType=${type}&frameShape=${shapeSlug}`}
                    onClick={onClose}
                    className={`block px-3 py-2 rounded-lg transition text-sm ${
                      isActiveShape(shape)
                        ? "bg-[#EBF4FC] text-[#3D96EB] font-medium"
                        : "text-text hover:bg-[#EBF4FC] hover:text-[#3D96EB]"
                    }`}
                  >
                    {shape}
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 px-3 py-2">
                No shapes available
              </p>
            )
          ) : (
            <>
              <Link
                to="/shop?productType=contactlens"
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                Daily Disposable
              </Link>
              <Link
                to="/shop?productType=contactlens"
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-[#EBF4FC] hover:text-[#3D96EB] transition text-sm text-text"
              >
                Monthly Lenses
              </Link>
              <Link
                to="/shop?productType=contactlens"
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
        <div className="space-y-1">
          {brandsWithProducts.length > 0 ? (
            brandsWithProducts.slice(0, 5).map((brand) => (
              <Link
                key={brand._id}
                to={`/shop?brand=${brand.slug}`}
                onClick={onClose}
                className={`block px-3 py-2 rounded-lg transition text-sm ${
                  isActiveBrand(brand.slug)
                    ? "bg-[#EBF4FC] text-[#3D96EB] font-medium"
                    : "text-text hover:bg-[#EBF4FC] hover:text-[#3D96EB]"
                }`}
              >
                {brand.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-3 py-2">
              No brands available
            </p>
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
