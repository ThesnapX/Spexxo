// frontend/src/utils/productHelpers.js

/**
 * Get the best image for a product, considering variants
 * Returns the default variant's image if available, otherwise falls back to main product image
 */
export const getProductImage = (product) => {
  if (!product) return null;

  // For variable products, try to get the default variant's image
  if (product.variants && product.variants.length > 0) {
    // Find the default variant
    let defaultVariant = product.variants.find((v) => v.isDefault === true);
    // If no default variant is marked, use the first one
    if (!defaultVariant) {
      defaultVariant = product.variants[0];
    }
    // Check if the default variant has images
    if (defaultVariant.images && defaultVariant.images.length > 0) {
      return defaultVariant.images[0].url;
    }
  }

  // Fallback to product images
  if (product.images && product.images.length > 0) {
    return product.images[0].url;
  }

  return null;
};

/**
 * Check if product has variants
 */
export const hasVariants = (product) => {
  return product.variants && product.variants.length > 0;
};

/**
 * Get display price with discount for product
 */
export const getProductPrice = (product) => {
  let displayPrice = product.price || 0;
  let originalPrice = product.price || 0;
  let hasDiscount = false;
  let discountPercent = 0;

  if (hasVariants(product)) {
    const variantPrices = product.variants.map((v) => v.price || 0);
    const variantComparePrices = product.variants.map(
      (v) => v.comparePrice || 0,
    );
    const minPrice = Math.min(...variantPrices);
    const minCompare = Math.min(...variantComparePrices);

    if (minCompare > 0 && minCompare < minPrice) {
      displayPrice = minCompare;
      originalPrice = minPrice;
      hasDiscount = true;
      discountPercent = Math.round(((minPrice - minCompare) / minPrice) * 100);
    } else {
      displayPrice = minPrice;
      originalPrice = minPrice;
    }
  } else {
    if (product.comparePrice && product.comparePrice < product.price) {
      displayPrice = product.comparePrice;
      originalPrice = product.price;
      hasDiscount = true;
      discountPercent = Math.round(
        ((product.price - product.comparePrice) / product.price) * 100,
      );
    } else {
      displayPrice = product.price || 0;
      originalPrice = product.price || 0;
    }
  }

  return { displayPrice, originalPrice, hasDiscount, discountPercent };
};

/**
 * Check if product is out of stock
 */
export const isProductOutOfStock = (product) => {
  if (hasVariants(product)) {
    // Check if ALL variants are out of stock
    return product.variants.every((v) => v.stock <= 0 || v.stock === null);
  }
  // Simple product
  return (
    product.stock === 0 || product.stock === null || product.stock === undefined
  );
};

/**
 * Get variant count
 */
export const getVariantCount = (product) => {
  return product.variants ? product.variants.length : 0;
};
