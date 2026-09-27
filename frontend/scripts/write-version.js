// frontend/src/utils/productHelpers.js

/**
 * Determine the default variant for a product.
 * Rules:
 *   1. First variant marked isDefault === true
 *   2. If none, the first variant in the array
 *   3. If no variants, null
 */
export const getDefaultVariant = (product) => {
  if (!product?.variants || product.variants.length === 0) return null;
  return (
    product.variants.find((v) => v.isDefault === true) || product.variants[0]
  );
};

/**
 * Whether the product has variants at all.
 */
export const hasVariants = (product) =>
  Array.isArray(product?.variants) && product.variants.length > 0;

/**
 * Best-effort image for a product. Priority:
 *   1. Default variant image (if any)
 *   2. First active variant with an image
 *   3. Product-level image
 *   4. null
 */
export const getProductImage = (product) => {
  if (!product) return null;

  if (hasVariants(product)) {
    const def = getDefaultVariant(product);
    if (def?.images?.[0]?.url) return def.images[0].url;

    // Deterministic fallback: first variant that actually has an image.
    const firstWithImage = product.variants.find((v) => v?.images?.[0]?.url);
    if (firstWithImage?.images?.[0]?.url) {
      return firstWithImage.images[0].url;
    }
  }

  return product.images?.[0]?.url || null;
};

/**
 * Canonical display price for a product.
 *
 * Rules:
 *   - Determine which variant (if any) drives the price.
 *   - If that variant has a valid comparePrice < price, use it.
 *   - Otherwise use the parent's price/comparePrice.
 *   - Never mix a discount% computed from one variant's compare with
 *     another variant's price.
 *
 * Returns: { displayPrice, originalPrice, hasDiscount, discountPercent }
 */
export const getProductPrice = (product) => {
  const safe = (n) => {
    const v = Number(n);
    return Number.isFinite(v) && v >= 0 ? v : null;
  };

  // ── Variant-driven pricing ──
  if (hasVariants(product)) {
    const def = getDefaultVariant(product);
    if (def) {
      const vPrice = safe(def.price);
      const vCompare = safe(def.comparePrice);

      if (vPrice !== null) {
        // Only treat compare as a discount when it is genuinely lower.
        if (vCompare !== null && vCompare > 0 && vCompare < vPrice) {
          return {
            displayPrice: vCompare,
            originalPrice: vPrice,
            hasDiscount: true,
            discountPercent: Math.round(((vPrice - vCompare) / vPrice) * 100),
          };
        }
        return {
          displayPrice: vPrice,
          originalPrice: vPrice,
          hasDiscount: false,
          discountPercent: 0,
        };
      }
    }

    // Variant has no usable price → fall through to parent.
  }

  // ── Parent-level pricing ──
  const pPrice = safe(product.price) ?? 0;
  const pCompare = safe(product.comparePrice);

  if (pCompare !== null && pCompare > 0 && pCompare < pPrice) {
    return {
      displayPrice: pCompare,
      originalPrice: pPrice,
      hasDiscount: true,
      discountPercent:
        pPrice > 0 ? Math.round(((pPrice - pCompare) / pPrice) * 100) : 0,
    };
  }

  return {
    displayPrice: pPrice,
    originalPrice: pPrice,
    hasDiscount: false,
    discountPercent: 0,
  };
};

export const isProductOutOfStock = (product) => {
  if (hasVariants(product)) {
    return product.variants.every((v) => (Number(v.stock) || 0) <= 0);
  }
  return (Number(product?.stock) || 0) <= 0;
};

export const getVariantCount = (product) =>
  hasVariants(product) ? product.variants.length : 0;

export const hasAnyDiscount = (product) => {
  const { hasDiscount } = getProductPrice(product);
  return hasDiscount;
};

export const getBestDiscount = (product) => {
  const { discountPercent } = getProductPrice(product);
  return discountPercent;
};
