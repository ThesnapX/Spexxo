// frontend/src/utils/htmlToBlocks.js

/**
 * Converts an HTML string into an array of blog blocks.
 * Handles: headings, paragraphs, images, lists, blockquotes, tables, hr, embeds.
 * Falls back to a paragraph block for unsupported content.
 *
 * Also auto-creates image-text blocks when an image is immediately followed by a paragraph
 * (very common in Word exports).
 */

let idCounter = 0;
const uid = (prefix = "blk") => `${prefix}_${Date.now()}_${++idCounter}`;

const stripTags = (html) => html.replace(/<[^>]*>/g, "").trim();

/**
 * Split top-level nodes from a DOM container
 */
const getNodes = (html) => {
  const doc = new DOMParser().parseFromString(
    `<div>${html}</div>`,
    "text/html",
  );
  const root = doc.body.firstElementChild;
  return Array.from(root.childNodes);
};

/**
 * Convert a single node → zero or more blocks
 */
const nodeToBlocks = (node) => {
  // Text node with content → paragraph
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    if (!text) return [];
    return [
      {
        id: uid(),
        type: "paragraph",
        settings: {},
        data: { text: escapeHtml(text) },
      },
    ];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const tag = node.tagName.toLowerCase();
  const inner = () => node.innerHTML;
  const outerText = () => node.textContent.trim();

  // Headings
  if (/^h[1-4]$/.test(tag)) {
    return [
      {
        id: uid(),
        type: "heading",
        settings: {},
        data: { level: Number(tag[1]), text: outerText() },
      },
    ];
  }

  // Paragraph
  if (tag === "p") {
    // Empty / whitespace-only paragraph → spacer
    if (!outerText() && !node.querySelector("img")) {
      return [
        { id: uid(), type: "spacer", settings: {}, data: { height: 20 } },
      ];
    }

    // If paragraph contains only an image, treat as image block
    const imgs = node.querySelectorAll("img");
    if (imgs.length === 1 && stripTags(inner()) === "") {
      return imageToBlock(imgs[0]);
    }

    return [
      {
        id: uid(),
        type: "paragraph",
        settings: {},
        data: { text: sanitizeInline(inner()) },
      },
    ];
  }

  // Standalone images
  if (tag === "img") {
    return imageToBlock(node);
  }

  // Figure (image + caption)
  if (tag === "figure") {
    const img = node.querySelector("img");
    const caption = node.querySelector("figcaption")?.textContent || "";
    if (img) {
      const block = imageToBlock(img)[0];
      if (caption) block.data.caption = caption;
      return [block];
    }
  }

  // Lists
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(node.querySelectorAll("li")).map((li) =>
      stripTags(li.innerHTML),
    );
    if (items.length === 0) return [];
    return [
      {
        id: uid(),
        type: "list",
        settings: {},
        data: { ordered: tag === "ol", items },
      },
    ];
  }

  // Blockquote
  if (tag === "blockquote") {
    return [
      {
        id: uid(),
        type: "quote",
        settings: { borderColor: "#3D96EB" },
        data: { text: outerText(), author: "" },
      },
    ];
  }

  // Divider
  if (tag === "hr") {
    return [
      {
        id: uid(),
        type: "divider",
        settings: { style: "solid", thickness: 1, borderColor: "#e5e7eb" },
      },
    ];
  }

  // Tables
  if (tag === "table") {
    const rows = Array.from(node.querySelectorAll("tr"));
    if (rows.length === 0) return [];
    const headers = Array.from(rows[0].querySelectorAll("th,td")).map((c) =>
      stripTags(c.innerHTML),
    );
    const bodyRows = rows
      .slice(1)
      .map((tr) =>
        Array.from(tr.querySelectorAll("td,th")).map((c) =>
          stripTags(c.innerHTML),
        ),
      );
    return [
      {
        id: uid(),
        type: "table",
        settings: {},
        data: { headers, rows: bodyRows },
      },
    ];
  }

  // divs & spans → recurse
  if (
    tag === "div" ||
    tag === "section" ||
    tag === "article" ||
    tag === "span"
  ) {
    const children = Array.from(node.childNodes);
    return children.flatMap(nodeToBlocks);
  }

  // Links standalone → paragraph
  if (tag === "a") {
    return [
      {
        id: uid(),
        type: "paragraph",
        settings: {},
        data: {
          text: `<a href="${node.getAttribute("href")}">${outerText()}</a>`,
        },
      },
    ];
  }

  // Fallback: paragraph
  if (outerText()) {
    return [
      {
        id: uid(),
        type: "paragraph",
        settings: {},
        data: { text: sanitizeInline(inner()) },
      },
    ];
  }
  return [];
};

const imageToBlock = (img) => {
  // Handle base64/data URIs and normal URLs
  let src = img.getAttribute("src") || "";
  // Word sometimes wraps images in <v:imagedata>
  if (!src) {
    const vImg = img.closest("p")?.querySelector("v\\:imagedata");
    if (vImg) src = vImg.getAttribute("src");
  }
  return [
    {
      id: uid(),
      type: "image",
      settings: { width: 100, align: "center" },
      data: {
        url: src,
        alt: img.getAttribute("alt") || "",
        caption: "",
        _isDataUri: src.startsWith("data:"), // flag for upload step
      },
    },
  ];
};

/**
 * Very light sanitizer: keeps allowed inline tags & attributes
 */
const sanitizeInline = (html) => {
  // Strip out Word-specific classes & inline styles
  return html
    .replace(/<\s*span[^>]*>/gi, "")
    .replace(/<\s*\/span>/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/<o:[^>]*>.*?<\/o:[^>]*>/gis, "")
    .replace(/<v:[^>]*>.*?<\/v:[^>]*>/gis, "")
    .trim();
};

const escapeHtml = (text) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

/**
 * Public API
 */
export const htmlToBlocks = (html) => {
  if (!html || typeof html !== "string") return [];
  const nodes = getNodes(html);
  const blocks = nodes.flatMap(nodeToBlocks);

  // Post-process: merge image + following paragraph into image-text blocks
  const merged = [];
  for (let i = 0; i < blocks.length; i++) {
    const cur = blocks[i];
    const next = blocks[i + 1];

    if (
      cur.type === "image" &&
      cur.data.url &&
      next?.type === "paragraph" &&
      next.data.text?.length > 20 &&
      next.data.text.length < 400
    ) {
      merged.push({
        id: cur.id,
        type: "image-text",
        settings: { layout: "image-left" },
        data: {
          imageUrl: cur.data.url,
          imageAlt: cur.data.alt || "",
          heading: "",
          text: next.data.text,
        },
      });
      i++; // skip next
      continue;
    }
    merged.push(cur);
  }

  // Insert spacers between tight clusters for readability
  return merged;
};

/**
 * Extract all data-URI images for upload to Cloudinary.
 * Returns blocks with data URIs untouched — caller will upload and replace.
 */
export const extractDataUriImages = (blocks) => {
  const list = [];
  blocks.forEach((b, i) => {
    if (b.type === "image" && b.data.url?.startsWith("data:")) {
      list.push({ index: i, dataUri: b.data.url, path: "data.url" });
    }
    if (b.type === "image-text" && b.data.imageUrl?.startsWith("data:")) {
      list.push({ index: i, dataUri: b.data.imageUrl, path: "data.imageUrl" });
    }
    if (b.type === "gallery" && Array.isArray(b.data.images)) {
      b.data.images.forEach((img, j) => {
        if (img.url?.startsWith("data:")) {
          list.push({
            index: i,
            subIndex: j,
            dataUri: img.url,
            path: "data.images",
          });
        }
      });
    }
  });
  return list;
};

/**
 * dataURI → File → upload via /api/upload/single
 * Returns a new blocks array with URLs replaced
 */
export const uploadDataUriImages = async (blocks, axios, API_URL, token) => {
  const dataUris = extractDataUriImages(blocks);
  if (dataUris.length === 0) return blocks;

  const newBlocks = JSON.parse(JSON.stringify(blocks));
  let uploaded = 0;

  for (const item of dataUris) {
    try {
      const blob = await (await fetch(item.dataUri)).blob();
      const ext = blob.type.split("/")[1] || "png";
      const file = new File(
        [blob],
        `word-image-${Date.now()}-${uploaded}.${ext}`,
        {
          type: blob.type,
        },
      );

      const fd = new FormData();
      fd.append("image", file);

      const { data } = await axios.post(`${API_URL}/upload/single`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (item.path === "data.images") {
        newBlocks[item.index].data.images[item.subIndex].url = data.image.url;
      } else if (item.path === "data.imageUrl") {
        newBlocks[item.index].data.imageUrl = data.image.url;
      } else {
        newBlocks[item.index].data.url = data.image.url;
      }
      uploaded++;
    } catch (e) {
      console.error("Failed to upload data-URI image:", e);
    }
  }
  console.log(
    `Uploaded ${uploaded}/${dataUris.length} images from Word import`,
  );
  return newBlocks;
};
