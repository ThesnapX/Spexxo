// frontend/src/components/common/SEO.jsx

import { Helmet } from "react-helmet-async";

const SITE_NAME = "Spexxo";
const SITE_URL = "https://spexxo.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/images/og-image.jpg`;
const DEFAULT_DESCRIPTION =
  "Shop premium eyeglasses, sunglasses & contact lenses online at Spexxo. Best prices, COD available, free shipping on orders above ₹999.";

/**
 * SEO component.
 *
 * Props:
 *   title        — page-specific title (rendered as `${title} | Spexxo`)
 *   description  — page-specific meta description
 *   keywords     — optional legacy keyword string
 *   ogImage      — absolute URL to a representative image
 *   ogType       — "website" | "article" | "product"
 *   canonicalUrl — absolute URL. If omitted, derived from window.location.pathname.
 *   robots       — "index, follow" (default) | "noindex, nofollow"
 *   noIndex      — shorthand to force noindex
 *   product      — optional Product doc for Product JSON-LD
 *   blog         — optional Blog doc for BlogPosting JSON-LD
 *   breadcrumbs  — optional [{ name, item }] for BreadcrumbList JSON-LD
 *   jsonLd       — optional array of extra JSON-LD objects
 */
const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalUrl,
  robots,
  noIndex = false,
  product,
  blog,
  breadcrumbs,
  jsonLd,
}) => {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const image = ogImage || DEFAULT_IMAGE;

  // Canonical: caller supplies it, or we compute it from the CURRENT
  // pathname WITHOUT the query string.
  let canonical = canonicalUrl;
  if (!canonical && typeof window !== "undefined") {
    canonical = `${SITE_URL}${window.location.pathname}`;
  }
  if (!canonical) canonical = `${SITE_URL}/`;

  const robotsContent =
    robots || (noIndex ? "noindex, nofollow" : "index, follow");

  // ---- Structured Data ----
  const schemas = [];

  // Organization + WebSite — only on the true homepage
  const isHomepage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/" || window.location.pathname === "");

  if (isHomepage) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      description:
        "Premium eyewear store offering eyeglasses, sunglasses, and contact lenses.",
      sameAs: [
        "https://www.instagram.com/_spexxo",
        "https://www.facebook.com/people/Spexxo/61593421605663/",
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
        email: "info.spexxo@gmail.com",
      },
    });

    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/shop?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }

  // Product JSON-LD — only if a valid product is passed AND not noIndex
  if (product && product._id && !noIndex) {
    const price =
      Number(product.comparePrice) > 0 &&
      Number(product.comparePrice) < Number(product.price)
        ? Number(product.comparePrice)
        : Number(product.price) || 0;

    const inStock =
      product.stock !== undefined
        ? product.stock > 0
        : Array.isArray(product.variants)
          ? product.variants.some((v) => (v.stock || 0) > 0)
          : true;

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description:
        product.shortDescription ||
        (product.description
          ? String(product.description).substring(0, 300)
          : product.name),
      image: product.images?.length
        ? product.images.map((i) => i.url).filter(Boolean)
        : [image],
      sku: product.sku || product.productId || undefined,
      brand: product.brand?.name
        ? { "@type": "Brand", name: product.brand.name }
        : undefined,
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/product/${product.slug}`,
        priceCurrency: "INR",
        price: price,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };

    if (product.ratings?.count > 0 && product.ratings?.average > 0) {
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: product.ratings.average,
        reviewCount: product.ratings.count,
      };
    }

    schemas.push(productSchema);
  }

  // BlogPosting JSON-LD
  if (blog && blog._id && !noIndex) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.seo?.metaTitle || blog.title,
      description:
        blog.seo?.metaDescription ||
        blog.excerpt ||
        (blog.content
          ? String(blog.content)
              .replace(/<[^>]*>/g, "")
              .substring(0, 200)
          : ""),
      image: blog.featuredImage?.url || blog.seo?.ogImage || image,
      datePublished: blog.publishedAt || blog.createdAt,
      dateModified: blog.updatedAt || blog.createdAt || blog.publishedAt,
      author: {
        "@type": "Person",
        name: blog.author || "Spexxo Team",
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/favicon.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/${blog.slug}`,
      },
    });
  }

  // Breadcrumbs
  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && !noIndex) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.item,
      })),
    });
  }

  // Extra caller-supplied
  if (Array.isArray(jsonLd)) schemas.push(...jsonLd);

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
