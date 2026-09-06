// frontend/src/utils/imageUtils.js

/**
 * Get optimized image URL from Cloudinary
 * @param {string} url - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return url;
  if (!url.includes("cloudinary.com")) return url;

  const {
    width = 400,
    height = 400,
    quality = 80,
    format = "webp",
    crop = "fill",
  } = options;

  try {
    // Parse the Cloudinary URL
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;

    const transformations = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
  } catch {
    return url;
  }
};

/**
 * Get responsive image srcset for Cloudinary images
 */
export const getResponsiveImageSrcSet = (
  url,
  sizes = [400, 600, 800, 1200],
) => {
  if (!url || !url.includes("cloudinary.com")) return null;

  try {
    const parts = url.split("/upload/");
    if (parts.length !== 2) return null;

    const base = parts[0];
    const path = parts[1];

    return sizes
      .map((size) => {
        const transformations = `w_${size},q_80,f_webp`;
        return `${base}/upload/${transformations}/${path} ${size}w`;
      })
      .join(", ");
  } catch {
    return null;
  }
};

/**
 * Get thumbnail size image
 */
export const getThumbnailUrl = (url) => {
  return getOptimizedImageUrl(url, { width: 200, height: 200, quality: 70 });
};

/**
 * Get product card image (medium size)
 */
export const getProductCardImageUrl = (url) => {
  return getOptimizedImageUrl(url, { width: 400, height: 400, quality: 80 });
};

/**
 * Get hero/featured image (large size)
 */
export const getHeroImageUrl = (url) => {
  return getOptimizedImageUrl(url, { width: 1200, height: 600, quality: 85 });
};
