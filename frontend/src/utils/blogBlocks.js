// frontend/src/utils/blogBlocks.js

/**
 * Blog block schema, defaults, and migration from old formats.
 *
 * NEW block types (as per spec):
 *   heading, richText, image, video, divider, spacer, toc,
 *   imageText, textImage, videoText, textVideo, productShowcase
 */

export const uid = () =>
  `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ─────────────────────────────────────────────
// Block factory
// ─────────────────────────────────────────────
export const createBlock = (type) => {
  const id = uid();
  const base = { id, type, data: {}, settings: {} };

  switch (type) {
    case "heading":
      return {
        ...base,
        data: { text: "New Heading", level: 2, align: "left" },
      };

    case "richText":
      return {
        ...base,
        data: { html: "<p>Write your paragraph here…</p>", align: "left" },
      };

    case "image":
      return {
        ...base,
        data: {
          url: "",
          alt: "",
          caption: "",
          linkUrl: "",
          openInNewTab: false,
        },
        settings: { width: 100, align: "center", radius: 12 },
      };

    case "video":
      return {
        ...base,
        data: { url: "", aspect: "16:9" },
        settings: { width: 100, align: "center", radius: 12 },
      };

    case "divider":
      return {
        ...base,
        settings: {
          color: "#e5e7eb",
          thickness: 1,
          width: 100,
          style: "solid",
        },
      };

    case "spacer":
      return { ...base, data: { height: 32 } };

    case "toc":
      return {
        ...base,
        data: { title: "Table of Contents", levels: [2, 3, 4] },
      };

    case "imageText":
      return {
        ...base,
        data: {
          media: { kind: "image", url: "", alt: "" },
          heading: "",
          html: "<p>Describe this image…</p>",
        },
        settings: { gap: 24, radius: 12, mobileOrder: "media-first" },
      };

    case "textImage":
      return {
        ...base,
        data: {
          media: { kind: "image", url: "", alt: "" },
          heading: "",
          html: "<p>Describe this image…</p>",
        },
        settings: { gap: 24, radius: 12, mobileOrder: "text-first" },
      };

    case "videoText":
      return {
        ...base,
        data: {
          media: { kind: "video", url: "" },
          heading: "",
          html: "<p>Explain this video…</p>",
        },
        settings: { gap: 24, radius: 12, mobileOrder: "media-first" },
      };

    case "textVideo":
      return {
        ...base,
        data: {
          media: { kind: "video", url: "" },
          heading: "",
          html: "<p>Explain this video…</p>",
        },
        settings: { gap: 24, radius: 12, mobileOrder: "text-first" },
      };

    case "productShowcase":
      return {
        ...base,
        data: { title: "", products: [], display: "grid" },
        settings: {
          colsDesktop: 4,
          colsTablet: 2,
          colsMobile: 2,
          gap: 16,
        },
      };

    default:
      return base;
  }
};

// ─────────────────────────────────────────────
// Editor library (grouped) — used by block picker UI
// ─────────────────────────────────────────────
export const EDITOR_LIBRARY = [
  {
    group: "Text",
    items: [
      { type: "heading", label: "Heading" },
      { type: "richText", label: "Rich Text" },
    ],
  },
  {
    group: "Media",
    items: [
      { type: "image", label: "Image" },
      { type: "video", label: "Video" },
    ],
  },
  {
    group: "Visual Layout",
    items: [
      { type: "imageText", label: "Image + Text" },
      { type: "textImage", label: "Text + Image" },
      { type: "videoText", label: "Video + Text" },
      { type: "textVideo", label: "Text + Video" },
    ],
  },
  {
    group: "Content",
    items: [
      { type: "divider", label: "Divider" },
      { type: "spacer", label: "Spacer" },
      { type: "toc", label: "Table of Contents" },
      { type: "faq", label: "FAQ" }, // ✅ NEW
    ],
  },
  {
    group: "Store",
    items: [{ type: "productShowcase", label: "Product Showcase" }],
  },
];

// ─────────────────────────────────────────────
// Migration: any old format → new format
// ─────────────────────────────────────────────
/**
 * Handles:
 *  - null / empty
 *  - legacy HTML string (pre-block era)
 *  - old block JSON (with type: "paragraph", "columns", "image-text", etc.)
 *  - already-new block JSON
 */
export const migrateToBlocks = (content) => {
  if (!content) return [];

  // Case 1: string
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (!trimmed) return [];

    // Try JSON parse
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return migrateBlocksArray(parsed);
    } catch {
      // not JSON
    }

    // Legacy HTML
    return [
      {
        id: uid(),
        type: "richText",
        data: { html: trimmed, align: "left" },
        settings: {},
      },
    ];
  }

  // Case 2: already an array
  if (Array.isArray(content)) return migrateBlocksArray(content);

  return [];
};

const migrateBlocksArray = (arr) => {
  const out = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const converted = migrateBlock(raw);
    if (converted) out.push(converted);
    // Columns block → flatten its child columns into Image+Text / stacked blocks
    if (raw.type === "columns" && Array.isArray(raw.children)) {
      // Simplification: keep first-column blocks, then second-column blocks.
      // Preserves user content, avoids a huge converter.
      raw.children.forEach((col) => {
        if (Array.isArray(col.children)) {
          col.children.forEach((child) => {
            const c = migrateBlock(child);
            if (c) out.push(c);
          });
        }
      });
    }
  }
  return out;
};

const migrateBlock = (b) => {
  if (!b || !b.type) return null;

  // Already new-format
  if (
    [
      "heading",
      "richText",
      "image",
      "video",
      "divider",
      "spacer",
      "toc",
      "imageText",
      "textImage",
      "videoText",
      "textVideo",
      "productShowcase",
      "faq",
    ].includes(b.type)
  ) {
    return {
      id: b.id || uid(),
      type: b.type,
      data: { ...(b.data || {}) },
      settings: { ...(b.settings || {}) },
    };
  }

  // ── Old → New mappings ──
  switch (b.type) {
    case "paragraph":
      return {
        id: b.id || uid(),
        type: "richText",
        data: {
          html: b.data?.text || b.data?.html || "",
          align: b.settings?.align || "left",
        },
        settings: {},
      };

    case "list": {
      const items = b.data?.items || [];
      const tag = b.data?.ordered ? "ol" : "ul";
      const html = `<${tag}>${items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`;
      return {
        id: b.id || uid(),
        type: "richText",
        data: { html, align: "left" },
        settings: {},
      };
    }

    case "quote":
      return {
        id: b.id || uid(),
        type: "richText",
        data: {
          html: `<blockquote><p>${b.data?.text || ""}</p>${
            b.data?.author ? `<cite>— ${b.data.author}</cite>` : ""
          }</blockquote>`,
          align: "left",
        },
        settings: {},
      };

    case "callout":
      return {
        id: b.id || uid(),
        type: "richText",
        data: {
          html: `<div class="p-3 bg-blue-50 border border-blue-100 rounded-lg"><p><strong>${b.data?.title || ""}</strong> ${b.data?.text || ""}</p></div>`,
          align: "left",
        },
        settings: {},
      };

    case "image-text": {
      const media = {
        kind: "image",
        url: b.data?.imageUrl || "",
        alt: b.data?.imageAlt || "",
      };
      const isLeft = b.settings?.layout !== "image-right";
      return {
        id: b.id || uid(),
        type: isLeft ? "imageText" : "textImage",
        data: {
          media,
          heading: b.data?.heading || "",
          html: b.data?.text || "",
        },
        settings: { gap: 24, radius: 12, mobileOrder: "media-first" },
      };
    }

    case "two-column": {
      const html = `<div class="grid grid-cols-2 gap-4">${b.data?.left || ""}${b.data?.right || ""}</div>`;
      return {
        id: b.id || uid(),
        type: "richText",
        data: { html, align: "left" },
        settings: {},
      };
    }

    case "table": {
      const headers = b.data?.headers || [];
      const rows = b.data?.rows || [];
      const html = `<table class="w-full border text-sm"><thead><tr>${headers
        .map((h) => `<th class="p-2 border bg-gray-50 text-left">${h}</th>`)
        .join("")}</tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr>${r
              .map((c) => `<td class="p-2 border">${c}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</tbody></table>`;
      return {
        id: b.id || uid(),
        type: "richText",
        data: { html, align: "left" },
        settings: {},
      };
    }

    case "gallery": {
      const imgs = b.data?.images || [];
      if (imgs.length === 0) return null;
      return {
        id: b.id || uid(),
        type: "image",
        data: { url: imgs[0].url || "", alt: "", caption: "" },
        settings: { width: 100, align: "center", radius: 12 },
      };
    }
    case "faq":
      return {
        ...base,
        data: {
          title: "Frequently Asked Questions",
          items: [
            { q: "Question 1?", a: "Answer 1." },
            { q: "Question 2?", a: "Answer 2." },
          ],
        },
      };

    case "embed": {
      return {
        id: b.id || uid(),
        type: "video",
        data: { url: b.data?.url || "", aspect: "16:9" },
        settings: { width: 100, align: "center", radius: 12 },
      };
    }

    case "button":
      return {
        id: b.id || uid(),
        type: "richText",
        data: {
          html: `<p><a href="${b.data?.url || "#"}" style="display:inline-block;padding:10px 20px;background:${b.data?.bgColor || "#3D96EB"};color:${b.data?.textColor || "#fff"};border-radius:8px;text-decoration:none">${b.data?.text || "Click here"}</a></p>`,
          align: b.settings?.align || "left",
        },
        settings: {},
      };

    case "code":
      return {
        id: b.id || uid(),
        type: "richText",
        data: {
          html: `<pre class="p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm"><code>${(b.data?.code || "").replace(/</g, "&lt;")}</code></pre>`,
          align: "left",
        },
        settings: {},
      };

    default:
      return null;
  }
};
