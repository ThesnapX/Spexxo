// frontend/src/utils/productHelpers.js

/**
 * Get the best image for a product, considering variants
 * Returns the default variant's image if available, otherwise falls back to main product image
 */
export const getProductImage = (product) => {
  if (!product) return null;

  let imageUrl = null;

  // For variable products, try to get the default variant's image
  if (product.variants && product.variants.length > 0) {
    let defaultVariant = product.variants.find((v) => v.isDefault === true);
    if (!defaultVariant) {
      defaultVariant = product.variants[0];
    }
    if (defaultVariant.images && defaultVariant.images.length > 0) {
      imageUrl = defaultVariant.images[0].url;
    }
  }

  // Fallback to product images
  if (!imageUrl && product.images && product.images.length > 0) {
    imageUrl = product.images[0].url;
  }

  return imageUrl || null;
};

/**
 * Check if product has variants
 */
export const hasVariants = (product) => {
  return product.variants && product.variants.length > 0;
};

/**
 * Get the default variant of a product
 */
export const getDefaultVariant = (product) => {
  if (!product.variants || product.variants.length === 0) return null;
  return (
    product.variants.find((v) => v.isDefault === true) || product.variants[0]
  );
};

/**
 * Get display price with discount for product
 * Checks both parent level and variant level comparePrice
 */
export const getProductPrice = (product) => {
  let displayPrice = product.price || 0;
  let originalPrice = product.price || 0;
  let hasDiscount = false;
  let discountPercent = 0;

  // ✅ Check parent level discount first
  if (
    product.comparePrice &&
    product.comparePrice > 0 &&
    product.comparePrice < product.price
  ) {
    displayPrice = product.comparePrice;
    originalPrice = product.price;
    hasDiscount = true;
    discountPercent = Math.round(
      ((product.price - product.comparePrice) / product.price) * 100,
    );
    return { displayPrice, originalPrice, hasDiscount, discountPercent };
  }

  // ✅ If variable product, check variant-level discounts
  if (hasVariants(product)) {
    const defaultVariant = getDefaultVariant(product);

    if (defaultVariant) {
      const variantPrice = defaultVariant.price || 0;
      const variantCompare = defaultVariant.comparePrice || 0;

      // ✅ Check if variant has a discount
      if (variantCompare > 0 && variantCompare < variantPrice) {
        displayPrice = variantCompare;
        originalPrice = variantPrice;
        hasDiscount = true;
        discountPercent = Math.round(
          ((variantPrice - variantCompare) / variantPrice) * 100,
        );
      } else {
        displayPrice = variantPrice;
        originalPrice = variantPrice;
      }
    }

    // Also check if any variant has a better discount
    let minPrice = Infinity;
    let minCompare = Infinity;
    let foundDiscount = false;

    product.variants.forEach((v) => {
      const price = v.price || 0;
      const compare = v.comparePrice || 0;

      if (price < minPrice) minPrice = price;
      if (compare > 0 && compare < price) {
        if (compare < minCompare) minCompare = compare;
        foundDiscount = true;
      }
    });

    // If we found any variant with discount and it's better than current
    if (foundDiscount && minCompare < minPrice) {
      displayPrice = minCompare;
      originalPrice = minPrice;
      hasDiscount = true;
      discountPercent = Math.round(((minPrice - minCompare) / minPrice) * 100);
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

/**
 * Check if product has any discount (at parent or variant level)
 */
export const hasAnyDiscount = (product) => {
  // Check parent level
  if (
    product.comparePrice &&
    product.comparePrice > 0 &&
    product.comparePrice < product.price
  ) {
    return true;
  }

  // Check variant level
  if (hasVariants(product)) {
    return product.variants.some((v) => {
      const compare = v.comparePrice || 0;
      const price = v.price || 0;
      return compare > 0 && compare < price;
    });
  }

  return false;
};

/**
 * Get the best discount percentage from product (parent or variants)
 */
export const getBestDiscount = (product) => {
  let bestDiscount = 0;

  // Check parent level
  if (
    product.comparePrice &&
    product.comparePrice > 0 &&
    product.comparePrice < product.price
  ) {
    bestDiscount = Math.round(
      ((product.price - product.comparePrice) / product.price) * 100,
    );
  }

  // Check variant level
  if (hasVariants(product)) {
    product.variants.forEach((v) => {
      const compare = v.comparePrice || 0;
      const price = v.price || 0;
      if (compare > 0 && compare < price) {
        const discount = Math.round(((price - compare) / price) * 100);
        if (discount > bestDiscount) bestDiscount = discount;
      }
    });
  }

  return bestDiscount;
};
