// frontend/src/components/blog/BlockRenderer.jsx

/**
 * Renders a single block. Used in both editor preview and public blog page.
 */

const alignClass = (align) =>
  align === "center"
    ? "text-center"
    : align === "right"
      ? "text-right"
      : "text-left";

const justifyClass = (align) =>
  align === "center"
    ? "justify-center"
    : align === "right"
      ? "justify-end"
      : "justify-start";

const Container = ({ block, children, className = "" }) => {
  const styles = {
    paddingTop: block.settings?.paddingTop ?? 8,
    paddingBottom: block.settings?.paddingBottom ?? 8,
    paddingLeft: block.settings?.paddingLeft ?? 0,
    paddingRight: block.settings?.paddingRight ?? 0,
    backgroundColor: block.settings?.background || "transparent",
    borderRadius: block.settings?.borderRadius
      ? `${block.settings.borderRadius}px`
      : undefined,
    marginTop: block.settings?.marginTop ?? 0,
    marginBottom: block.settings?.marginBottom ?? 0,
    color: block.settings?.textColor || undefined,
  };
  return (
    <div style={styles} className={className}>
      {children}
    </div>
  );
};

export const BlogBlock = ({ block }) => {
  if (!block || !block.type) return null;
  const s = block.settings || {};

  switch (block.type) {
    case "heading": {
      const Tag = `h${block.data.level || 2}`;
      const sizes = {
        1: "text-3xl md:text-4xl",
        2: "text-2xl md:text-3xl",
        3: "text-xl md:text-2xl",
        4: "text-lg md:text-xl",
      };
      return (
        <Container block={block} className={alignClass(s.align)}>
          <Tag
            className={`font-bold text-text ${sizes[block.data.level || 2] || ""}`}
          >
            {block.data.text || "Heading"}
          </Tag>
        </Container>
      );
    }

    case "paragraph":
      return (
        <Container block={block}>
          <p
            className={`leading-relaxed ${alignClass(s.align)}`}
            style={{ fontSize: s.fontSize ? `${s.fontSize}px` : undefined }}
            dangerouslySetInnerHTML={{ __html: block.data.text || "" }}
          />
        </Container>
      );

    case "image":
      return (
        <Container block={block}>
          <div className={`flex ${justifyClass(s.align || "center")}`}>
            <div style={{ width: s.width ? `${s.width}%` : "100%" }}>
              {block.data.url ? (
                <img
                  src={block.data.url}
                  alt={block.data.alt || ""}
                  className="w-full h-auto rounded-lg"
                  style={{
                    borderRadius: s.borderRadius
                      ? `${s.borderRadius}px`
                      : undefined,
                  }}
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  Image
                </div>
              )}
              {block.data.caption && (
                <p className="text-xs text-text-light text-center mt-2">
                  {block.data.caption}
                </p>
              )}
            </div>
          </div>
        </Container>
      );

    case "image-text": {
      const reverse = s.layout === "image-right";
      return (
        <Container block={block}>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${
              reverse ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              {block.data.imageUrl ? (
                <img
                  src={block.data.imageUrl}
                  alt={block.data.imageAlt || ""}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  Image
                </div>
              )}
            </div>
            <div>
              {block.data.heading && (
                <h3 className="text-xl md:text-2xl font-bold text-text mb-3">
                  {block.data.heading}
                </h3>
              )}
              <div
                className="text-text-light leading-relaxed"
                dangerouslySetInnerHTML={{ __html: block.data.text || "" }}
              />
            </div>
          </div>
        </Container>
      );
    }

    case "list": {
      const Tag = block.data.ordered ? "ol" : "ul";
      const listClass = block.data.ordered ? "list-decimal" : "list-disc";
      return (
        <Container block={block}>
          <Tag className={`${listClass} pl-6 space-y-1`}>
            {(block.data.items || []).map((item, i) => (
              <li key={i} className="text-text-light leading-relaxed">
                {item}
              </li>
            ))}
          </Tag>
        </Container>
      );
    }

    case "quote":
      return (
        <Container block={block}>
          <blockquote
            className="border-l-4 pl-4 italic"
            style={{ borderColor: s.borderColor || "#3D96EB" }}
          >
            <p className="text-lg text-text leading-relaxed">
              "{block.data.text || ""}"
            </p>
            {block.data.author && (
              <footer className="text-sm text-text-light mt-2">
                — {block.data.author}
              </footer>
            )}
          </blockquote>
        </Container>
      );

    case "callout": {
      const variants = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-green-50 border-green-200 text-green-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        error: "bg-red-50 border-red-200 text-red-800",
      };
      const variantClass = variants[block.data.variant || "info"];
      return (
        <Container block={block}>
          <div className={`border rounded-lg p-4 ${variantClass}`}>
            {block.data.title && (
              <p className="font-semibold mb-1">{block.data.title}</p>
            )}
            <p className="text-sm">{block.data.text || ""}</p>
          </div>
        </Container>
      );
    }

    case "divider":
      return (
        <Container block={block}>
          <hr
            className="border-t"
            style={{
              borderColor: s.borderColor || "#e5e7eb",
              borderWidth: s.thickness || 1,
              borderStyle: s.style || "solid",
            }}
          />
        </Container>
      );

    case "spacer":
      return <div style={{ height: `${block.data.height || 40}px` }} />;

    case "button":
      return (
        <Container block={block}>
          <div className={`flex ${justifyClass(s.align || "left")}`}>
            <a
              href={block.data.url || "#"}
              target={block.data.url?.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-lg font-medium transition hover:opacity-90"
              style={{
                backgroundColor: block.data.bgColor || "#3D96EB",
                color: block.data.textColor || "#ffffff",
                borderRadius: s.borderRadius
                  ? `${s.borderRadius}px`
                  : undefined,
              }}
            >
              {block.data.text || "Click here"}
            </a>
          </div>
        </Container>
      );

    case "embed": {
      const url = block.data.url || "";
      // YouTube
      const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/,
      );
      if (ytMatch) {
        return (
          <Container block={block}>
            <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                title="Embedded video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          </Container>
        );
      }
      return (
        <Container block={block}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {url}
          </a>
        </Container>
      );
    }

    case "gallery":
      return (
        <Container block={block}>
          <div
            className={`grid gap-3`}
            style={{
              gridTemplateColumns: `repeat(${s.columns || 3}, minmax(0, 1fr))`,
            }}
          >
            {(block.data.images || []).map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt || ""}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </Container>
      );

    case "two-column":
      return (
        <Container block={block}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="text-text-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: block.data.left || "" }}
            />
            <div
              className="text-text-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: block.data.right || "" }}
            />
          </div>
        </Container>
      );

    case "table":
      return (
        <Container block={block}>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {(block.data.headers || []).map((h, i) => (
                    <th
                      key={i}
                      className="text-left p-3 font-semibold text-text"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(block.data.rows || []).map((row, ri) => (
                  <tr key={ri} className="border-t border-gray-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="p-3 text-text-light">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      );

    case "code":
      return (
        <Container block={block}>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{block.data.code || ""}</code>
          </pre>
        </Container>
      );

    default:
      return null;
  }
};

/**
 * Renders an array of blocks. Used in the public BlogDetail page.
 */
const BlockRenderer = ({ blocks }) => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return <p className="text-text-light">No content yet.</p>;
  }
  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <BlogBlock key={block.id} block={block} />
      ))}
    </div>
  );
};

export default BlockRenderer;
