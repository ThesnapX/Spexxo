// frontend/src/components/blog/BlogBlockRenderer.jsx

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import ProductCard from "../common/ProductCard";

/**
 * Shared renderer for all blog blocks.
 * Used by:
 *   - Public BlogDetail page
 *   - Editor preview
 *   - Admin BlogDetailView
 */

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

/**
 * Build the list of TOC entries from the blocks.
 * Uses heading index to guarantee uniqueness, so two headings
 * with the same text don't collide.
 */
export const buildToc = (blocks, levels = [2, 3, 4]) => {
  if (!Array.isArray(blocks)) return [];
  const items = [];
  blocks.forEach((b, idx) => {
    if (b.type === "heading") {
      const lvl = b.data?.level || 2;
      if (!levels.includes(lvl)) return;
      const text = (b.data?.text || "").trim();
      if (!text) return;
      // ✅ Priority: block's own anchorId > auto slug + index (guaranteed unique)
      const slug = slugify(text) || `h-${idx}`;
      const id =
        (b.data?.anchorId && b.data.anchorId.trim()) || `section-${slug}`;
      items.push({ id, text, level: lvl, blockId: b.id });
    }
  });
  return items;
};

const safeUrl = (url) => {
  if (!url) return "#";
  if (/^(https?:|\/|#|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
};

const alignmentClass = (align) => {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
};

const justifyClass = (align) => {
  if (align === "center") return "justify-center";
  if (align === "right") return "justify-end";
  return "justify-start";
};

const alignItemsStyle = (v) => {
  if (v === "center") return "center";
  if (v === "bottom") return "end";
  return "start";
};

/**
 * Robust scroll-to-anchor.
 * Works across:
 *   - public page (scrolls window)
 *   - editor preview modal (scrolls the modal's scroll container)
 *   - any nested scroll container
 * Uses element.scrollIntoView which finds the nearest scrollable ancestor.
 */
export const scrollToAnchor = (id) => {
  if (!id) return;
  // Try by ID first (fast path)
  let el = document.getElementById(id);
  // Fallback: query by data attribute (in case DOM ids were remounted)
  if (!el) el = document.querySelector(`[data-anchor="${id}"]`);
  if (!el) {
    console.warn("[TOC] Anchor not found:", id);
    return;
  }
  // scrollIntoView scrolls the nearest scrollable ancestor, so this
  // works inside the preview modal, the editor canvas, and the page.
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Update URL hash without jumping (only if we're not in a modal)
  try {
    if (window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
  } catch {}
};

// ─────────────────────────────────────────────
// Sub-renderers per block type
// ─────────────────────────────────────────────

const HeadingBlock = ({ block, tocItems }) => {
  const { level = 2, text = "", align = "left", anchorId } = block.data || {};
  const s = block.settings || {};
  const Tag = `h${level}`;

  // ✅ Use the SAME id that buildToc generated for this heading
  const tocEntry = tocItems.find((t) => t.blockId === block.id);
  const id = tocEntry?.id || anchorId || `section-${slugify(text) || block.id}`;

  const styles = {
    textAlign: align,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontWeight: s.fontWeight ? Number(s.fontWeight) : undefined,
    lineHeight: s.lineHeight || undefined,
    color: s.color || undefined,
    marginTop: s.marginTop != null ? `${s.marginTop}px` : undefined,
    marginBottom: s.marginBottom != null ? `${s.marginBottom}px` : "1rem",
    // ✅ Ensures the heading isn't hidden under a fixed header when scrolled to
    scrollMarginTop: "96px",
  };

  const defaultSize =
    {
      2: "text-2xl md:text-[28px] lg:text-[32px]",
      3: "text-xl md:text-[22px] lg:text-[24px]",
      4: "text-lg md:text-[19px] lg:text-[20px]",
    }[level] || "text-xl";

  return (
    <Tag
      id={id}
      data-anchor={id}
      className={`font-bold text-text ${!s.fontSize ? defaultSize : ""} ${alignmentClass(align)}`}
      style={styles}
    >
      {text || <span className="text-text-light italic">Heading…</span>}
    </Tag>
  );
};

const RichTextBlock = ({ block }) => {
  const { html = "", align = "left" } = block.data || {};
  const s = block.settings || {};
  const style = {
    textAlign: align,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    lineHeight: s.lineHeight || 1.75,
    color: s.color || undefined,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
  return (
    <div
      className="blog-richtext text-text-light leading-relaxed
        [&_p]:mb-4 [&_p:last-child]:mb-0
        [&_a]:text-primary [&_a]:underline
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
        [&_li]:mb-1
        [&_strong]:text-text [&_strong]:font-semibold
        [&_em]:italic
        [&_u]:underline
        [&_s]:line-through
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-text [&_h1]:mt-6 [&_h1]:mb-3
        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-text [&_h3]:mt-5 [&_h3]:mb-2
        [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-text [&_h4]:mt-4 [&_h4]:mb-2
        [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-light [&_blockquote]:my-4
        [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
        [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:text-sm
        [&_img]:my-4 [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto
      "
      style={style}
      dangerouslySetInnerHTML={{ __html: html || "<p></p>" }}
    />
  );
};

const ImageBlock = ({ block }) => {
  const {
    url,
    alt = "",
    caption = "",
    linkUrl,
    openInNewTab,
  } = block.data || {};
  const s = block.settings || {};
  const width = s.width ?? 100;
  const align = s.align || "center";
  const radius = s.radius ?? 12;

  if (!url) {
    return (
      <div className="my-4 flex items-center justify-center h-40 bg-gray-100 rounded-xl text-text-light text-sm">
        Image
      </div>
    );
  }

  const img = (
    <img
      src={url}
      alt={alt || caption || ""}
      loading="lazy"
      className="w-full h-auto"
      style={{ borderRadius: `${radius}px` }}
    />
  );

  return (
    <figure className={`my-4 flex ${justifyClass(align)}`}>
      <div style={{ width: `${width}%`, maxWidth: "100%" }}>
        {linkUrl ? (
          <a
            href={safeUrl(linkUrl)}
            target={openInNewTab ? "_blank" : "_self"}
            rel="noopener noreferrer"
          >
            {img}
          </a>
        ) : (
          img
        )}
        {caption && (
          <figcaption className="text-xs text-text-light text-center mt-2">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
};

const VideoBlock = ({ block }) => {
  const { url = "", aspect = "16:9" } = block.data || {};
  const s = block.settings || {};
  const align = s.align || "center";
  const width = s.width ?? 100;
  const radius = s.radius ?? 12;

  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) {
    return (
      <div className="my-4 flex items-center justify-center h-40 bg-gray-100 rounded-xl text-text-light text-sm">
        Paste a YouTube or Vimeo URL
      </div>
    );
  }

  const aspectClass =
    {
      "16:9": "aspect-video",
      "4:3": "aspect-[4/3]",
      "1:1": "aspect-square",
    }[aspect] || "aspect-video";

  return (
    <div className={`my-4 flex ${justifyClass(align)}`}>
      <div
        className={`w-full overflow-hidden bg-black ${aspectClass}`}
        style={{ width: `${width}%`, borderRadius: `${radius}px` }}
      >
        <iframe
          src={embedUrl}
          title="Video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(safeUrl(url));
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const v = u.pathname.split("/").filter(Boolean)[0];
      if (v) return `https://player.vimeo.com/video/${v}`;
    }
  } catch {
    return null;
  }
  return null;
};

const DividerBlock = ({ block }) => {
  const s = block.settings || {};
  const color = s.color || "#e5e7eb";
  const thickness = s.thickness ?? 1;
  const width = s.width ?? 100;
  const style = s.style || "solid";

  return (
    <div className="my-6 flex justify-center">
      <div
        style={{
          width: `${width}%`,
          borderTop: `${thickness}px ${style} ${color}`,
        }}
      />
    </div>
  );
};

const SpacerBlock = ({ block }) => {
  const height = block.data?.height ?? 32;
  return <div style={{ height: `${height}px` }} aria-hidden="true" />;
};

/**
 * ✅ TOC Block — now uses the shared scrollToAnchor helper.
 * Works in editor, preview modal, and public page.
 */
const TocBlock = ({ block, tocItems }) => {
  const { title = "Table of Contents" } = block.data || {};
  const s = block.settings || {};

  if (!tocItems || tocItems.length === 0) {
    return (
      <div className="my-6 p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-text-light">
        <p className="font-semibold text-text mb-1">{title}</p>
        <p className="text-xs">
          Add H2 / H3 / H4 headings to the blog to auto-populate this Table of
          Contents.
        </p>
      </div>
    );
  }

  const handleClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    scrollToAnchor(id);
  };

  return (
    <nav
      className="my-6 p-5 rounded-xl bg-gray-50 border border-gray-100"
      aria-label="Table of contents"
    >
      <p
        className="font-semibold text-text mb-3"
        style={{
          fontSize: s.titleSize ? `${s.titleSize}px` : undefined,
          color: s.titleColor || undefined,
        }}
      >
        {title}
      </p>
      <ol className="space-y-1.5" style={{ listStyle: "none", paddingLeft: 0 }}>
        {tocItems.map((item, i) => (
          <li key={item.id} style={{ paddingLeft: (item.level - 2) * 14 }}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className="text-sm text-text-light hover:text-primary transition flex gap-2 cursor-pointer"
            >
              <span className="text-primary font-medium tabular-nums shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ── Layout blocks ──
const MediaTextLayout = ({ block, mediaSide }) => {
  const d = block.data || {};
  const s = block.settings || {};
  const gap = s.gap ?? 24;
  const radius = s.radius ?? 12;
  const mobileOrder =
    s.mobileOrder || (mediaSide === "left" ? "media-first" : "text-first");

  const vAlign = s.verticalAlign || "top";
  const alignItems = alignItemsStyle(vAlign);

  const media = d.media || {};
  const isVideo = media.kind === "video";

  let mediaEl = null;
  if (isVideo) {
    const embedUrl = getEmbedUrl(media.url || "");
    if (embedUrl) {
      mediaEl = (
        <div
          className="w-full aspect-video bg-black overflow-hidden"
          style={{ borderRadius: `${radius}px` }}
        >
          <iframe
            src={embedUrl}
            title="Video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    } else {
      mediaEl = (
        <div
          className="w-full aspect-video bg-gray-100 flex items-center justify-center text-text-light text-sm"
          style={{ borderRadius: `${radius}px` }}
        >
          Video
        </div>
      );
    }
  } else if (media.url) {
    mediaEl = (
      <img
        src={media.url}
        alt={media.alt || ""}
        loading="lazy"
        className="w-full h-auto block"
        style={{ borderRadius: `${radius}px` }}
      />
    );
  } else {
    mediaEl = (
      <div
        className="w-full aspect-square bg-gray-100 flex items-center justify-center text-text-light text-sm"
        style={{ borderRadius: `${radius}px` }}
      >
        Image
      </div>
    );
  }

  const textEl = (
    <div className="flex flex-col">
      {d.heading && (
        <h3 className="text-xl md:text-2xl font-bold text-text mb-3">
          {d.heading}
        </h3>
      )}
      {d.html && (
        <div
          className="text-text-light leading-relaxed space-y-3
            [&_p]:mb-3 [&_p:last-child]:mb-0
            [&_a]:text-primary [&_a]:underline
            [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:list-decimal [&_ol]:pl-6
            [&_strong]:text-text [&_strong]:font-semibold
            [&_em]:italic
          "
          style={{ whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{ __html: d.html }}
        />
      )}
      {!d.heading && !d.html && (
        <p className="text-text-light italic text-sm">Text content…</p>
      )}
    </div>
  );

  const mediaFirstDesktop = mediaSide === "left";
  const mediaFirstMobile = mobileOrder === "media-first";

  return (
    <div className="my-6">
      <div
        className="hidden md:grid"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gap: `${gap}px`,
          alignItems,
        }}
      >
        {mediaFirstDesktop ? (
          <>
            {mediaEl}
            {textEl}
          </>
        ) : (
          <>
            {textEl}
            {mediaEl}
          </>
        )}
      </div>
      <div className="md:hidden flex flex-col" style={{ gap: `${gap}px` }}>
        {mediaFirstMobile ? (
          <>
            {mediaEl}
            {textEl}
          </>
        ) : (
          <>
            {textEl}
            {mediaEl}
          </>
        )}
      </div>
    </div>
  );
};

// ── Product Showcase ──
const ProductShowcaseBlock = ({ block }) => {
  const d = block.data || {};
  const s = block.settings || {};
  const products = d.products || [];
  const colsDesktop = s.colsDesktop ?? 4;
  const colsTablet = s.colsTablet ?? 2;
  const colsMobile = s.colsMobile ?? 2;
  const gap = s.gap ?? 16;

  if (!products || products.length === 0) {
    return (
      <div className="my-6 p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-sm text-text-light">
        Product Showcase — select products in the editor
      </div>
    );
  }

  const validProducts = products.filter(
    (p) => p && (p._id || typeof p === "string"),
  );

  return (
    <div className="my-6">
      {d.title && (
        <h3 className="text-lg md:text-xl font-bold text-text mb-4">
          {d.title}
        </h3>
      )}
      <div
        className="grid"
        style={{
          gap: `${gap}px`,
          gridTemplateColumns: `repeat(${colsMobile}, minmax(0, 1fr))`,
        }}
      >
        <style>{`
          @media (min-width: 640px) { .ps-${block.id} { grid-template-columns: repeat(${colsTablet}, minmax(0, 1fr)) !important; } }
          @media (min-width: 1024px) { .ps-${block.id} { grid-template-columns: repeat(${colsDesktop}, minmax(0, 1fr)) !important; } }
        `}</style>
        <div className={`contents ps-${block.id}`} />
        {validProducts.map((p, i) => {
          const isDeleted = typeof p === "object" && p.__deleted;
          if (isDeleted) {
            return (
              <div
                key={i}
                className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-text-light flex items-center justify-center min-h-[120px]"
              >
                Product unavailable
              </div>
            );
          }
          if (typeof p === "string") {
            return (
              <Link
                key={p}
                to={`/product/${p}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 text-center text-xs text-text-light hover:border-primary transition"
              >
                View Product →
              </Link>
            );
          }
          return (
            <ProductCard key={p._id || i} product={p} showSaleBadge={true} />
          );
        })}
      </div>
    </div>
  );
};

// ── FAQ Block ──
const FaqBlock = ({ block }) => {
  const d = block.data || {};
  const s = block.settings || {};
  const title = d.title || "Frequently Asked Questions";
  const items = Array.isArray(d.items) ? d.items : [];

  const [openIndex, setOpenIndex] = useState(
    s.defaultOpenFirst && items.length > 0 ? 0 : -1,
  );

  if (items.length === 0) {
    return (
      <div className="my-6 p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-sm text-text-light">
        FAQ — add questions in the editor
      </div>
    );
  }

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? -1 : i));

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-lg md:text-xl font-bold text-text mb-4">{title}</h3>
      )}
      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-xl border transition-colors ${
                isOpen
                  ? "border-primary/40 bg-[#EBF4FC]"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
              >
                <span className="font-medium text-text text-sm md:text-base">
                  {item.q || `Question ${i + 1}`}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 -mt-1">
                  <div
                    className="text-sm text-text-light leading-relaxed
                      [&_p]:mb-3 [&_p:last-child]:mb-0
                      [&_a]:text-primary [&_a]:underline
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                      [&_strong]:text-text [&_strong]:font-semibold
                      [&_em]:italic
                    "
                    style={{ whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ __html: item.a || "<p></p>" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main dispatcher
// ─────────────────────────────────────────────
const Block = ({ block, tocItems, isEditor }) => {
  if (!block || !block.type) return null;

  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} tocItems={tocItems} />;
    case "richText":
      return <RichTextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "divider":
      return <DividerBlock block={block} />;
    case "spacer":
      return <SpacerBlock block={block} />;
    case "toc":
      return <TocBlock block={block} tocItems={tocItems} />;
    case "imageText":
      return <MediaTextLayout block={block} mediaSide="left" />;
    case "textImage":
      return <MediaTextLayout block={block} mediaSide="right" />;
    case "videoText":
      return <MediaTextLayout block={block} mediaSide="left" />;
    case "textVideo":
      return <MediaTextLayout block={block} mediaSide="right" />;
    case "productShowcase":
      return <ProductShowcaseBlock block={block} />;
    case "faq":
      return <FaqBlock block={block} />;
    default:
      return null;
  }
};

const BlogBlockRenderer = ({ blocks, isEditor = false }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <p className="text-text-light italic text-center py-8">No content yet.</p>
    );
  }

  // ✅ Compute tocItems once, pass down to both headings and TOC blocks
  // so they always use the same ID for the same heading.
  const tocItems = useMemo(() => buildToc(blocks), [blocks]);

  return (
    <div className="blog-content max-w-none">
      {blocks.map((block) => (
        <Block
          key={block.id}
          block={block}
          tocItems={tocItems}
          isEditor={isEditor}
        />
      ))}
    </div>
  );
};

export default BlogBlockRenderer;
