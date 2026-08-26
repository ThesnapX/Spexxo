// frontend/src/pages/ProductDetail.jsx

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  StarIcon,
  HeartIcon,
  ShoppingBagIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  MinusIcon,
  PlusIcon,
  PhotoIcon,
  BoltIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import SEO from "../components/common/SEO";
import AuthPopup from "../components/common/AuthPopup";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showZoom, setShowZoom] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [openAccordion, setOpenAccordion] = useState("description");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedVariantImages, setSelectedVariantImages] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    images: [],
  });
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewPreviews, setReviewPreviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/products/${slug}`);
      return data;
    },
  });

  const product = data?.product;
  const isDeactivated = product?.isActive === false;

  // Fetch colors for display
  const { data: colorsData } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/colors`);
      return data.colors || [];
    },
    enabled: !!product,
  });

  const colors = colorsData || [];

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product?._id],
    queryFn: async () => {
      if (!product?._id) return [];
      try {
        const { data } = await axios.get(`${API_URL}/reviews/${product._id}`);
        return data.reviews || [];
      } catch {
        return [];
      }
    },
    enabled: !!product?._id,
  });

  const reviews = reviewsData || [];

  const { data: smartRelated } = useQuery({
    queryKey: [
      "smart-related",
      product?._id,
      product?.brand?._id,
      product?.frameShape,
      product?.lensType,
    ],
    queryFn: async () => {
      if (!product?._id) return [];
      const params = new URLSearchParams({ limit: 8 });
      if (product.frameShape) params.set("frameShape", product.frameShape);
      if (product.lensType) params.set("lensType", product.lensType);
      if (product.brand?._id) params.set("brand", product.brand._id);
      try {
        const { data } = await axios.get(
          `${API_URL}/products?${params.toString()}`,
        );
        return (data.products || [])
          .filter((p) => p._id !== product._id)
          .slice(0, 6);
      } catch {
        return [];
      }
    },
    enabled: !!product?._id,
  });

  // Set default variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      // Find the default variant or use the first one
      const defaultVariant =
        product.variants.find((v) => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant);
      if (defaultVariant.images?.length > 0) {
        setSelectedVariantImages(defaultVariant.images);
        setSelectedImage(0);
      } else {
        setSelectedVariantImages([]);
        setSelectedImage(0);
      }
    } else {
      // Reset variant selection for simple products
      setSelectedVariant(null);
      setSelectedVariantImages([]);
      setSelectedImage(0);
    }
  }, [product]);

  // Update images when selected variant changes
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.images?.length > 0) {
        setSelectedVariantImages(selectedVariant.images);
        setSelectedImage(0);
      } else {
        setSelectedVariantImages([]);
        setSelectedImage(0);
      }
    }
  }, [selectedVariant]);

  // ✅ NEW: Preselect variant from cart if product is in cart
  const { cart } = useCart();
  useEffect(() => {
    if (product && cart?.items?.length > 0 && product.variants?.length > 0) {
      // Find if this product is in the cart
      const cartItem = cart.items.find(
        (item) => item.product?._id === product._id,
      );

      if (cartItem && cartItem.variant) {
        // Find the matching variant in the product's variants
        const matchingVariant = product.variants?.find(
          (v) =>
            v._id?.toString() === cartItem.variant._id?.toString() ||
            v.name === cartItem.variant.name ||
            v.sku === cartItem.variant.sku,
        );

        if (matchingVariant) {
          setSelectedVariant(matchingVariant);
          if (matchingVariant.images?.length > 0) {
            setSelectedVariantImages(matchingVariant.images);
            setSelectedImage(0);
          }
        }
      }
    }
  }, [product, cart]);

  const displayRelated =
    smartRelated?.length > 0 ? smartRelated : data?.relatedProducts || [];

  // Get display price - use variant price or fallback to main product price
  const getDisplayPrice = () => {
    if (selectedVariant?.price) {
      return selectedVariant.price;
    }
    return product?.comparePrice || product?.price || 0;
  };

  const getOriginalPrice = () => {
    if (selectedVariant?.comparePrice) {
      return selectedVariant.comparePrice;
    }
    return product?.price || 0;
  };

  const getComparePrice = () => {
    if (selectedVariant?.comparePrice) {
      return selectedVariant.comparePrice;
    }
    return product?.comparePrice || 0;
  };

  const displayPrice = getDisplayPrice();
  const originalPrice = getOriginalPrice();
  const comparePrice = getComparePrice();

  const getDisplayStock = () => {
    if (selectedVariant?.stock !== undefined) {
      return selectedVariant.stock;
    }
    return product?.stock || 0;
  };

  const displayStock = getDisplayStock();
  const isVariantOutOfStock = selectedVariant && selectedVariant.stock <= 0;
  const isProductOutOfStock = !selectedVariant && (product?.stock || 0) <= 0;

  // Helper function to get color details from color ID or name
  const getColorDetails = (colorId) => {
    if (!colorId) return null;
    // If colorId is an object (populated)
    if (typeof colorId === "object" && colorId !== null) {
      return colorId;
    }
    // If colorId is a string (ID)
    const color = colors.find((c) => c._id === colorId);
    return color || null;
  };

  // Get variant attributes for display
  const getVariantAttributes = () => {
    if (selectedVariant) {
      return {
        frameShape: selectedVariant.frameShape || null,
        frameMaterial: selectedVariant.frameMaterial || null,
        lensType: selectedVariant.lensType || null,
        frameColor: selectedVariant.frameColor || null,
        frameWidth: selectedVariant.frameWidth || null,
        lensWidth: selectedVariant.lensWidth || null,
        frameHeight: selectedVariant.frameHeight || null,
        bridge: selectedVariant.bridge || null,
      };
    }
    // Fallback to product-level attributes
    return {
      frameShape: product?.frameShape || null,
      frameMaterial: product?.frameMaterial || null,
      lensType: product?.lensType || null,
      frameColor: product?.frameColor || null,
      frameWidth: product?.frameWidth || null,
      lensWidth: product?.lensWidth || null,
      frameHeight: product?.frameHeight || null,
      bridge: product?.bridge || null,
    };
  };

  const variantAttributes = getVariantAttributes();

  // Helper function to get attribute values as array
  const getAttributeValues = (value) => {
    if (!value) return [];
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  };

  // Get color details for frame colors
  const getColorInfo = (colorName) => {
    if (!colorName) return null;
    return colors.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
  };

  const handleAddToCart = () => {
    if (isDeactivated) {
      toast.error("This product is currently deactivated");
      return;
    }
    if (selectedVariant && selectedVariant.stock <= 0) {
      toast.error("Selected variant is out of stock");
      return;
    }
    if (!selectedVariant && (product?.stock || 0) <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    addToCart(product._id, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    if (isDeactivated) {
      toast.error("This product is currently deactivated");
      return;
    }
    if (selectedVariant && selectedVariant.stock <= 0) {
      toast.error("Selected variant is out of stock");
      return;
    }
    if (!selectedVariant && (product?.stock || 0) <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    // ✅ Get variant image if available
    let variantImage = "";
    let variantData = selectedVariant;

    if (selectedVariant) {
      // Check if variant has images
      if (selectedVariant.images && selectedVariant.images.length > 0) {
        variantImage = selectedVariant.images[0]?.url || "";
      }
      // If variant has no images, use product image
      if (!variantImage) {
        variantImage = product.images?.[0]?.url || "";
      }
    } else {
      variantImage = product.images?.[0]?.url || "";
    }

    const buyNowItem = {
      productId: product._id,
      quantity: quantity,
      variant: variantData,
      product: product,
      price: displayPrice,
      name: product.name,
      image: variantImage,
    };

    sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
    navigate("/checkout", { state: { buyNow: true } });
  };

  const handleWishlistClick = () => {
    if (isDeactivated) {
      toast.error("This product is currently deactivated");
      return;
    }
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }
    isInWishlist(product._id)
      ? removeFromWishlist(product._id)
      : addToWishlist(product._id);
  };

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files);
    setReviewImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setReviewPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    setReviewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error("Please write a review");
      return;
    }
    setSubmittingReview(true);
    try {
      let uploadedImages = [];
      if (reviewImages.length > 0) {
        const fd = new FormData();
        reviewImages.forEach((f) => fd.append("images", f));
        const { data } = await axios.post(`${API_URL}/upload/multiple`, fd);
        uploadedImages = data.images;
      }
      await axios.post(`${API_URL}/reviews/${product._id}`, {
        ...reviewForm,
        images: uploadedImages,
      });
      toast.success("Review submitted!");
      setReviewForm({ rating: 5, title: "", comment: "", images: [] });
      setReviewImages([]);
      setReviewPreviews([]);
      refetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Only show discount if comparePrice exists and is less than price
  const hasDiscount = comparePrice > 0 && comparePrice < displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((displayPrice - comparePrice) / displayPrice) * 100)
    : 0;

  // Get frame colors with color swatches
  const getFrameColorsWithSwatches = (frameColorValue) => {
    if (!frameColorValue) return [];
    const colors = getAttributeValues(frameColorValue);
    return colors.map((colorName) => {
      const colorInfo = getColorInfo(colorName);
      return {
        name: colorName,
        hexCode: colorInfo?.hexCode || "#cccccc",
      };
    });
  };

  const frameColorDetails = getFrameColorsWithSwatches(
    variantAttributes.frameColor,
  );
  const frameShapes = getAttributeValues(variantAttributes.frameShape);
  const frameMaterials = getAttributeValues(variantAttributes.frameMaterial);
  const lensTypes = getAttributeValues(variantAttributes.lensType);

  if (isLoading) {
    return (
      <div className="pt-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div>
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24">
        <div className="container-custom text-center py-20">
          <p className="text-6xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-text mb-2">
            Product Not Found
          </h2>
          <Link to="/shop" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const whatsappMessage = `Hi Spexxo, I want to order:
  
*Product:* ${product.name}
${selectedVariant ? `*Variant:* ${selectedVariant.name}` : ""}
${selectedVariant?.sku ? `*SKU:* ${selectedVariant.sku}` : `*SKU:* ${product.sku || "N/A"}`}
*Price:* ₹${displayPrice?.toLocaleString()}
*Quantity:* ${quantity}

Please confirm availability.`;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description?.substring(0, 160)}
        ogImage={product.images?.[0]?.url}
        ogType="product"
      />

      <div className="pt-20 md:pt-24 pb-16">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-light mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link to="/" className="hover:text-primary transition">
              Home
            </Link>
            <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
            <Link to="/shop" className="hover:text-primary transition">
              Shop
            </Link>
            <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
            {product.brand?.name && (
              <>
                <Link
                  to={`/shop?brand=${product.brand.slug}`}
                  className="hover:text-primary transition"
                >
                  {product.brand.name}
                </Link>
                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
              </>
            )}
            <span className="text-text truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Image Gallery */}
            <div>
              <div
                className={`relative bg-gray-50 rounded-2xl overflow-hidden group ${
                  isDeactivated ? "opacity-60 grayscale" : "cursor-zoom-in"
                }`}
                onClick={() => !isDeactivated && setShowZoom(!showZoom)}
              >
                <img
                  src={
                    (selectedVariantImages?.length > 0
                      ? selectedVariantImages[selectedImage]?.url
                      : product.images?.[selectedImage]?.url) ||
                    "https://picsum.photos/800/800"
                  }
                  alt={product.name}
                  className={`w-full aspect-square object-cover transition-transform duration-300 ${
                    showZoom && !isDeactivated
                      ? "scale-150"
                      : "group-hover:scale-105"
                  }`}
                />
                {!isDeactivated && (
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition">
                    <ArrowsPointingOutIcon className="w-5 h-5 text-text" />
                  </button>
                )}
                {isDeactivated ? (
                  <span className="absolute top-4 left-4 bg-gray-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                    Deactivated
                  </span>
                ) : (
                  hasDiscount && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )
                )}
                {isVariantOutOfStock && !isDeactivated && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full rotate-[-15deg] shadow-lg">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>
              {(product.images?.length > 1 ||
                selectedVariantImages?.length > 0) && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {(selectedVariantImages?.length > 0
                    ? selectedVariantImages
                    : product.images
                  ).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setShowZoom(false);
                      }}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.brand?.name && (
                <p className="text-sm font-medium text-primary mb-2">
                  {product.brand.name}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-text mb-3 leading-tight">
                {product.name}
              </h1>
              {/* Price & Rating */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl md:text-3xl font-bold ${
                      isDeactivated || isVariantOutOfStock
                        ? "text-gray-400"
                        : "text-text"
                    }`}
                  >
                    ₹{displayPrice?.toLocaleString()}
                  </span>
                  {comparePrice > 0 && comparePrice < displayPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      ₹{comparePrice?.toLocaleString()}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {discountPercent}% off
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) =>
                      i < Math.round(product.ratings?.average || 0) ? (
                        <StarSolid
                          key={i}
                          className="w-4 h-4 text-yellow-400"
                        />
                      ) : (
                        <StarIcon key={i} className="w-4 h-4 text-gray-300" />
                      ),
                    )}
                  </div>
                  <span className="text-sm text-text-light font-medium">
                    {product.ratings?.average?.toFixed(1) || "0.0"} (
                    {product.ratings?.count || 0})
                  </span>
                </div>
              </div>

              {/* Variant Selector */}
              {product?.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-text mb-3 block">
                    Select Variant
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {product.variants.map((variant, index) => {
                      const isSelected =
                        selectedVariant?._id === variant._id ||
                        selectedVariant?.name === variant.name;
                      const isVariantActive = variant.isActive !== false;
                      const isVariantOutOfStock = variant.stock <= 0;
                      const isDisabled =
                        !isVariantActive || isVariantOutOfStock;
                      const color = getColorDetails(variant.color);
                      const variantPrice = variant.price || displayPrice;
                      const variantCompare = variant.comparePrice || 0;

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedVariant(variant);
                            }
                          }}
                          disabled={isDisabled}
                          className={`
              relative p-3 rounded-xl border-2 transition-all text-left
              ${
                isSelected && !isDisabled
                  ? "border-primary bg-[#EBF4FC] ring-2 ring-primary/20"
                  : isDisabled
                    ? "border-gray-200 opacity-60 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300"
              }
            `}
                        >
                          {/* Color Swatch */}
                          <div className="flex items-center gap-2 mb-1.5">
                            {color?.hexCode ? (
                              <span
                                className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: color.hexCode }}
                              />
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0 bg-gray-100" />
                            )}
                            <span className="text-sm font-medium text-text truncate">
                              {variant.name}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="text-xs text-text-light">
                            ₹{variantPrice?.toLocaleString()}
                            {variantCompare > 0 &&
                              variantCompare < variantPrice && (
                                <span className="text-gray-400 line-through ml-1.5">
                                  ₹{variantCompare?.toLocaleString()}
                                </span>
                              )}
                          </div>

                          {/* ✅ REMOVED: "in stock" text - only show when out of stock */}
                          <div className="text-xs mt-1">
                            {isVariantOutOfStock && (
                              <span className="text-red-500 font-medium">
                                Out of Stock
                              </span>
                            )}
                            {!isVariantActive && (
                              <span className="text-gray-400 ml-2">
                                (Inactive)
                              </span>
                            )}
                          </div>

                          {/* Selected Checkmark */}
                          {isSelected && !isDisabled && (
                            <div className="absolute top-2 right-2">
                              <CheckCircleIcon className="w-4 h-4 text-primary" />
                            </div>
                          )}

                          {/* Out of Stock Overlay */}
                          {isVariantOutOfStock && (
                            <div className="absolute inset-0 bg-gray-100/50 rounded-xl flex items-center justify-center">
                              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full rotate-[-15deg] shadow-lg">
                                OUT OF STOCK
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Variant Details */}
                  {selectedVariant && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-text-light">
                        Selected:{" "}
                        <span className="font-medium text-text">
                          {selectedVariant.name}
                        </span>
                        {selectedVariant.sku &&
                          ` • SKU: ${selectedVariant.sku}`}
                        {/* ✅ REMOVED: "in stock" text from selected variant */}
                      </p>
                      {/* Show variant attributes if any */}
                      {selectedVariant.frameShape && (
                        <p className="text-xs text-text-light mt-1">
                          Frame Shape: {selectedVariant.frameShape}
                        </p>
                      )}
                      {selectedVariant.lensType && (
                        <p className="text-xs text-text-light">
                          Lens Type: {selectedVariant.lensType}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Deactivated Banner */}
              {isDeactivated && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <ExclamationCircleIcon className="w-5 h-5" />
                    <span className="font-medium">
                      This product is currently deactivated
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    This product is not available for purchase at the moment.
                  </p>
                </div>
              )}
              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-text">Quantity:</span>
                <div
                  className={`flex items-center border rounded-lg ${
                    isDeactivated || isVariantOutOfStock
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-l-lg ${
                      isDeactivated || isVariantOutOfStock
                        ? "text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                    disabled={
                      isDeactivated || isVariantOutOfStock || quantity <= 1
                    }
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (v > 0 && v <= (displayStock || 99)) setQuantity(v);
                    }}
                    className={`w-14 text-center text-sm font-medium border-x py-2 focus:outline-none ${
                      isDeactivated || isVariantOutOfStock
                        ? "bg-gray-50 text-gray-400"
                        : ""
                    }`}
                    min="1"
                    max={displayStock || 99}
                    disabled={isDeactivated || isVariantOutOfStock}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-r-lg ${
                      isDeactivated || isVariantOutOfStock
                        ? "text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                    disabled={isDeactivated || isVariantOutOfStock}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                {/* ✅ REMOVED: "in stock" text - only show when unavailable */}
                {(isDeactivated || isVariantOutOfStock) && (
                  <span className="text-xs text-red-500">
                    {isDeactivated ? "Unavailable" : "Out of Stock"}
                  </span>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isDeactivated || isVariantOutOfStock || isProductOutOfStock
                  }
                  className={`flex-1 py-3.5 text-base rounded-full font-semibold transition flex items-center justify-center gap-2 ${
                    isDeactivated || isVariantOutOfStock || isProductOutOfStock
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "btn-primary"
                  }`}
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  {isDeactivated
                    ? "Unavailable"
                    : isVariantOutOfStock || isProductOutOfStock
                      ? "Out of Stock"
                      : "Add to Cart"}
                </button>
                <button
                  onClick={handleWishlistClick}
                  disabled={isDeactivated}
                  className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl transition flex-shrink-0 ${
                    isDeactivated
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : isInWishlist(product._id)
                        ? "border-red-500 bg-red-50 text-red-500"
                        : "border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {isInWishlist(product._id) ? (
                    <HeartSolid className="w-5 h-5" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={
                  isDeactivated || isVariantOutOfStock || isProductOutOfStock
                }
                className={`w-full py-3.5 rounded-full font-semibold text-base transition mb-6 flex items-center justify-center gap-2 ${
                  isDeactivated || isVariantOutOfStock || isProductOutOfStock
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-text text-white hover:bg-gray-800"
                }`}
              >
                <BoltIcon className="w-5 h-5" />
                {isDeactivated
                  ? "Unavailable"
                  : isVariantOutOfStock || isProductOutOfStock
                    ? "Out of Stock"
                    : "Buy Now"}
              </button>
              {/* WhatsApp Order */}
              {!isDeactivated &&
                !isVariantOutOfStock &&
                !isProductOutOfStock && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Need prescription glasses?
                    </p>
                    <p className="text-xs text-green-600 mb-3">
                      Order via WhatsApp - send your prescription and we'll
                      handle the rest.
                    </p>
                    <a
                      href={`https://wa.me/919969538739?text=${encodeURIComponent(whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition"
                    >
                      💬 Order on WhatsApp
                    </a>
                  </div>
                )}
            </div>
          </div>

          {/* Product Details Accordions */}
          <div className="max-w-3xl mb-16">
            <h2 className="text-xl font-bold text-text mb-6">
              Product Details
            </h2>
            <div className="space-y-3">
              {/* Description */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() =>
                    setOpenAccordion(
                      openAccordion === "description" ? "" : "description",
                    )
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-text">Description</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openAccordion === "description" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === "description"
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-5 pb-5 text-text-light leading-relaxed">
                    {product.description || "No description available."}
                  </div>
                </div>
              </div>

              {/* Dynamic Attributes - Updates based on selected variant */}
              {(frameShapes.length > 0 ||
                frameMaterials.length > 0 ||
                lensTypes.length > 0 ||
                frameColorDetails.length > 0 ||
                variantAttributes.frameWidth ||
                variantAttributes.lensWidth ||
                variantAttributes.frameHeight ||
                variantAttributes.bridge) && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() =>
                      setOpenAccordion(
                        openAccordion === "attributes" ? "" : "attributes",
                      )
                    }
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-semibold text-text">
                      Attributes
                      {selectedVariant && (
                        <span className="text-xs text-primary ml-2 font-normal">
                          (for {selectedVariant.name})
                        </span>
                      )}
                    </span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        openAccordion === "attributes" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openAccordion === "attributes"
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 space-y-3">
                      {/* Frame Shape */}
                      {frameShapes.length > 0 && (
                        <div className="flex items-start gap-4">
                          <h4 className="text-sm font-medium text-text-light w-32 flex-shrink-0 pt-1">
                            Frame Shape
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {frameShapes.map((shape, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-text"
                              >
                                {shape}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Frame Material */}
                      {frameMaterials.length > 0 && (
                        <div className="flex items-start gap-4">
                          <h4 className="text-sm font-medium text-text-light w-32 flex-shrink-0 pt-1">
                            Frame Material
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {frameMaterials.map((material, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-text"
                              >
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lens Type */}
                      {lensTypes.length > 0 && (
                        <div className="flex items-start gap-4">
                          <h4 className="text-sm font-medium text-text-light w-32 flex-shrink-0 pt-1">
                            Lens Type
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {lensTypes.map((lens, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-text"
                              >
                                {lens}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Frame Color - With Color Swatches */}
                      {frameColorDetails.length > 0 && (
                        <div className="flex items-start gap-4">
                          <h4 className="text-sm font-medium text-text-light w-32 flex-shrink-0 pt-1">
                            Frame Color
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {frameColorDetails.map((color, i) => (
                              <span
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-text"
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                                {color.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dimensions */}
                      {(variantAttributes.frameWidth ||
                        variantAttributes.lensWidth ||
                        variantAttributes.frameHeight ||
                        variantAttributes.bridge) && (
                        <>
                          <div className="border-t border-gray-200 my-2"></div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {variantAttributes.frameWidth && (
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-text-light">
                                  Frame Width
                                </p>
                                <p className="font-medium text-sm">
                                  {variantAttributes.frameWidth} mm
                                </p>
                              </div>
                            )}
                            {variantAttributes.lensWidth && (
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-text-light">
                                  Lens Width
                                </p>
                                <p className="font-medium text-sm">
                                  {variantAttributes.lensWidth} mm
                                </p>
                              </div>
                            )}
                            {variantAttributes.frameHeight && (
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-text-light">
                                  Frame Height
                                </p>
                                <p className="font-medium text-sm">
                                  {variantAttributes.frameHeight} mm
                                </p>
                              </div>
                            )}
                            {variantAttributes.bridge && (
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-text-light">
                                  Bridge
                                </p>
                                <p className="font-medium text-sm">
                                  {variantAttributes.bridge} mm
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specifications?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() =>
                      setOpenAccordion(openAccordion === "specs" ? "" : "specs")
                    }
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-semibold text-text">
                      Specifications
                    </span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        openAccordion === "specs" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openAccordion === "specs"
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                      {product.specifications.map((spec, i) => (
                        <div
                          key={i}
                          className="flex justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-text-light">
                            {spec.name}
                          </span>
                          <span className="text-sm font-medium text-text">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() =>
                    setOpenAccordion(openAccordion === "faq" ? "" : "faq")
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-text">FAQ</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      openAccordion === "faq" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === "faq"
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-5 pb-5 space-y-3">
                    {[
                      {
                        q: "What is the return policy?",
                        a: "7-day return for unused items in original packaging.",
                      },
                      {
                        q: "Does it come with a warranty?",
                        a: "6-month manufacturing warranty against defects.",
                      },
                      {
                        q: "Can I add prescription lenses?",
                        a: "Yes! Order via WhatsApp and send us your prescription.",
                      },
                    ].map((faq, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-text mb-1">
                          {faq.q}
                        </p>
                        <p className="text-xs text-text-light">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {displayRelated.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xl md:text-2xl font-bold text-text mb-6">
                Related Products
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayRelated.slice(0, 5).map((rp) => (
                  <Link
                    key={rp._id}
                    to={`/product/${rp.slug}`}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition hover:scale-[1.02]"
                  >
                    <div className="bg-gray-50">
                      <img
                        src={
                          rp.images?.[0]?.url || "https://picsum.photos/400/400"
                        }
                        alt={rp.name}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-text-light truncate">
                        {rp.brand?.name || ""}
                      </p>
                      <h3 className="font-medium text-sm text-text line-clamp-1 group-hover:text-primary">
                        {rp.name}
                      </h3>
                      <p className="text-sm font-bold text-text mt-1">
                        ₹{(rp.comparePrice || rp.price)?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="max-w-3xl">
            <h2 className="text-xl md:text-2xl font-bold text-text mb-6">
              Customer Reviews ({product.ratings?.count || 0})
            </h2>
            {isAuthenticated && !isDeactivated ? (
              <form
                onSubmit={handleSubmitReview}
                className="bg-white rounded-xl border border-gray-100 p-5 mb-6"
              >
                <h3 className="font-semibold text-text mb-4">Write a Review</h3>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: star })
                      }
                      className="transition hover:scale-110"
                    >
                      {star <= reviewForm.rating ? (
                        <StarSolid className="w-7 h-7 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-7 h-7 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Review title (optional)"
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm mb-3"
                  maxLength={100}
                />
                <textarea
                  rows="4"
                  placeholder="Share your experience..."
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none mb-3"
                  required
                  maxLength={500}
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  {reviewPreviews.map((p, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border"
                    >
                      <img
                        src={p}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(i)}
                        className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs rounded-tr-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                    <PhotoIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleReviewImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewForm.comment.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : isAuthenticated && isDeactivated ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center mb-6 border">
                <p className="text-text-light">
                  This product is deactivated, you cannot review it.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center mb-6 border">
                <p className="text-text-light mb-3">
                  Please log in to write a review
                </p>
                <button
                  onClick={() => setShowAuthPopup(true)}
                  className="btn-primary text-sm"
                >
                  Login to Review
                </button>
              </div>
            )}
            {reviews.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border">
                <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-text-light">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-white rounded-xl border p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                        {review.user?.firstName?.[0]}
                        {review.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) =>
                            i < review.rating ? (
                              <StarSolid
                                key={i}
                                className="w-3.5 h-3.5 text-yellow-400"
                              />
                            ) : (
                              <StarIcon
                                key={i}
                                className="w-3.5 h-3.5 text-gray-300"
                              />
                            ),
                          )}
                          <span className="text-xs text-text-light ml-2">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.title && (
                      <p className="font-medium text-sm mb-1">{review.title}</p>
                    )}
                    <p className="text-sm text-text-light">{review.comment}</p>
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt="Review"
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                        ))}
                      </div>
                    )}
                    {review.adminReply && (
                      <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            S
                          </div>
                          <p className="text-xs font-semibold text-blue-700">
                            Spexxo Admin
                          </p>
                          <span className="text-xs text-blue-400">•</span>
                          <span className="text-xs text-blue-400">
                            {new Date(
                              review.updatedAt || review.createdAt,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-text">{review.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Auth Popup */}
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        mode="login"
      />
    </>
  );
};

export default ProductDetail;
