// frontend/src/components/common/SEO.jsx

import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalUrl,
  product,
  blog,
  noIndex = false,
}) => {
  const siteName = "Spexxo";
  const siteUrl = "https://spexxo.vercel.app";
  const defaultImage = `${siteUrl}/images/og-image.jpg`;

  // ✅ Build proper page title
  const pageTitle = title ? `${title} | ${siteName}` : siteName;

  // ✅ Build proper description
  const pageDescription =
    description ||
    "Shop premium eyeglasses, sunglasses & contact lenses online at Spexxo. Best prices, COD available, free shipping on orders above ₹999.";

  const defaultKeywords =
    "eyeglasses, sunglasses, contact lenses, eyewear, spectacles, optical store, buy glasses online, Spexxo";

  // ✅ Product Structured Data
  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description?.substring(0, 200) || "",
        image: product.images?.[0]?.url || defaultImage,
        sku: product.sku,
        brand: {
          "@type": "Brand",
          name: product.brand?.name || "Spexxo",
        },
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/product/${product.slug}`,
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
        aggregateRating:
          product.ratings?.count > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: product.ratings?.average || 0,
                reviewCount: product.ratings?.count || 0,
              }
            : undefined,
      }
    : null;

  // ✅ Blog Structured Data
  const blogSchema = blog
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt || blog.content?.substring(0, 200) || "",
        image: blog.featuredImage?.url || defaultImage,
        datePublished: blog.publishedAt || blog.createdAt,
        dateModified: blog.updatedAt || blog.createdAt,
        author: {
          "@type": "Person",
          name: blog.author || "Spexxo Team",
        },
      }
    : null;

  // ✅ Breadcrumb Schema (for better sitelinks)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title || "Shop",
        item: canonicalUrl || siteUrl,
      },
    ],
  };

  // ✅ Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      "Premium eyewear store offering eyeglasses, sunglasses, and contact lenses.",
    sameAs: [
      "https://www.instagram.com/spexxo",
      "https://www.facebook.com/spexxo",
      "https://twitter.com/spexxo",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Chaitanya Nagar, I.I.T Market, Powai",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      postalCode: "400076",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9969538739",
      contactType: "customer service",
      email: "satyapatanakar5@gmail.com",
    },
  };

  // ✅ Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <meta name="googlebot" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:type" content={ogType} />
      <meta
        property="og:url"
        content={canonicalUrl || `${siteUrl}${window.location.pathname}`}
      />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage || defaultImage} />
      <meta name="twitter:site" content="@spexxo" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <link
        rel="canonical"
        href={canonicalUrl || `${siteUrl}${window.location.pathname}`}
      />

      {/* ✅ All Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}

      {blogSchema && (
        <script type="application/ld+json">{JSON.stringify(blogSchema)}</script>
      )}

      {/* ✅ Additional SEO Meta Tags */}
      <meta name="author" content="Spexxo" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
    </Helmet>
  );
};

export default SEO;
