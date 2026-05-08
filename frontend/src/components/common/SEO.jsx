import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalUrl,
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

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />

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

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: "https://spexxo.com",
          description: defaultDescription,
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
