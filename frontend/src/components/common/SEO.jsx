import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalUrl,
  product, // For product structured data
}) => {
  const siteName = "Spexxo";
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} - Premium Eyewear Store`;
  const defaultDescription =
    "Shop premium eyeglasses, sunglasses & contact lenses online at Spexxo. Best prices, COD available, free shipping on orders above ₹999.";
  const defaultKeywords =
    "eyeglasses, sunglasses, contact lenses, eyewear, spectacles, optical store, buy glasses online, Spexxo";
  const defaultOgImage = "/images/og-image.jpg";

  // Product Structured Data
  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images?.[0]?.url,
        sku: product.sku,
        brand: {
          "@type": "Brand",
          name: product.brand?.name || "Spexxo",
        },
        offers: {
          "@type": "Offer",
          url: `https://spexxo.com/product/${product.slug}`,
          priceCurrency: "INR",
          price: product.comparePrice || product.price,
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta
        name="twitter:description"
        content={description || defaultDescription}
      />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteName,
          url: "https://spexxo.com",
          logo: "https://spexxo.com/images/logo.png",
          description: defaultDescription,
        })}
      </script>

      {/* Product Schema */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
