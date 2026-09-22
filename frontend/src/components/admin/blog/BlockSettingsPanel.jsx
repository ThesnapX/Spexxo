// frontend/src/components/admin/blog/BlockSettingsPanel.jsx

import {
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import MiniRichText from "./MiniRichText";

// ── Small reusable controls ──
const Section = ({ title, children }) => (
  <div className="mb-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-text-light mb-2">
      {title}
    </p>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2">
    <label className="text-xs text-text-light">{label}</label>
    <div className="flex-1 max-w-[60%]">{children}</div>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary"
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary resize-none"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary bg-white"
  >
    {children}
  </select>
);

const BlockSettingsPanel = ({
  block,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onClose,
  onOpenProductPicker,
}) => {
  if (!block) return null;

  const updateData = (key, value) =>
    onChange({ ...block, data: { ...block.data, [key]: value } });
  const updateSettings = (key, value) =>
    onChange({
      ...block,
      settings: { ...(block.settings || {}), [key]: value },
    });
  const d = block.data || {};
  const s = block.settings || {};

  // ✅ FAQ helpers
  const addFaqItem = () => {
    const items = d.items || [];
    updateData("items", [...items, { q: "", a: "" }]);
  };

  const removeFaqItem = (index) => {
    const items = d.items || [];
    updateData(
      "items",
      items.filter((_, i) => i !== index),
    );
  };

  const updateFaqItem = (index, key, value) => {
    const items = [...(d.items || [])];
    items[index] = { ...items[index], [key]: value };
    updateData("items", items);
  };

  const moveFaqItem = (index, dir) => {
    const items = [...(d.items || [])];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateData("items", items);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-light">
            Selected Block
          </p>
          <h3 className="text-sm font-semibold text-text capitalize">
            {block.type}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ============================================== */}
        {/* HEADING                                        */}
        {/* ============================================== */}
        {block.type === "heading" && (
          <>
            <Section title="Content">
              <Textarea
                rows={2}
                value={d.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
                placeholder="Heading text"
              />
              <Row label="Level">
                <Select
                  value={d.level || 2}
                  onChange={(e) => updateData("level", Number(e.target.value))}
                >
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                </Select>
              </Row>
              <Row label="Align">
                <Select
                  value={d.align || "left"}
                  onChange={(e) => updateData("align", e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </Row>
              <Row label="Anchor ID">
                <Input
                  value={d.anchorId || ""}
                  onChange={(e) => updateData("anchorId", e.target.value)}
                  placeholder="(auto)"
                />
              </Row>
            </Section>
            <Section title="Typography">
              <Row label="Size (px)">
                <Input
                  type="number"
                  value={s.fontSize || ""}
                  onChange={(e) =>
                    updateSettings(
                      "fontSize",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="default"
                />
              </Row>
              <Row label="Weight">
                <Select
                  value={s.fontWeight || ""}
                  onChange={(e) => updateSettings("fontWeight", e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                  <option value="700">700</option>
                  <option value="800">800</option>
                </Select>
              </Row>
              <Row label="Color">
                <input
                  type="color"
                  value={s.color || "#0b1c39"}
                  onChange={(e) => updateSettings("color", e.target.value)}
                  className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                />
              </Row>
            </Section>
            <Section title="Spacing">
              <Row label="Margin top">
                <Input
                  type="number"
                  value={s.marginTop ?? 0}
                  onChange={(e) =>
                    updateSettings("marginTop", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Margin bottom">
                <Input
                  type="number"
                  value={s.marginBottom ?? 16}
                  onChange={(e) =>
                    updateSettings("marginBottom", Number(e.target.value))
                  }
                />
              </Row>
            </Section>
          </>
        )}

        {/* ============================================== */}
        {/* RICH TEXT                                      */}
        {/* ============================================== */}
        {block.type === "richText" && (
          <>
            <Section title="Content">
              <MiniRichText
                value={d.html || ""}
                onChange={(html) => updateData("html", html)}
                placeholder="Write your paragraph…"
              />
              <p className="text-[10px] text-text-light">
                Enter = new paragraph · Shift+Enter = line break
              </p>
              <Row label="Align">
                <Select
                  value={d.align || "left"}
                  onChange={(e) => updateData("align", e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </Row>
            </Section>
            <Section title="Typography">
              <Row label="Size (px)">
                <Input
                  type="number"
                  value={s.fontSize || ""}
                  onChange={(e) =>
                    updateSettings(
                      "fontSize",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="16"
                />
              </Row>
              <Row label="Line height">
                <Input
                  type="number"
                  step="0.1"
                  value={s.lineHeight || ""}
                  onChange={(e) =>
                    updateSettings(
                      "lineHeight",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="1.75"
                />
              </Row>
              <Row label="Color">
                <input
                  type="color"
                  value={s.color || "#4b5563"}
                  onChange={(e) => updateSettings("color", e.target.value)}
                  className="w-full h-8 rounded border border-gray-200 cursor-pointer"
                />
              </Row>
            </Section>
          </>
        )}

        {/* ============================================== */}
        {/* IMAGE                                          */}
        {/* ============================================== */}
        {block.type === "image" && (
          <>
            <Section title="Content">
              <Input
                value={d.url || ""}
                onChange={(e) => updateData("url", e.target.value)}
                placeholder="Image URL"
              />
              <Input
                value={d.alt || ""}
                onChange={(e) => updateData("alt", e.target.value)}
                placeholder="Alt text"
              />
              <Input
                value={d.caption || ""}
                onChange={(e) => updateData("caption", e.target.value)}
                placeholder="Caption (optional)"
              />
              <Input
                value={d.linkUrl || ""}
                onChange={(e) => updateData("linkUrl", e.target.value)}
                placeholder="Link URL (optional)"
              />
            </Section>
            <Section title="Display">
              <Row label="Width %">
                <Input
                  type="number"
                  value={s.width ?? 100}
                  onChange={(e) =>
                    updateSettings("width", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Align">
                <Select
                  value={s.align || "center"}
                  onChange={(e) => updateSettings("align", e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </Row>
              <Row label="Radius (px)">
                <Input
                  type="number"
                  value={s.radius ?? 12}
                  onChange={(e) =>
                    updateSettings("radius", Number(e.target.value))
                  }
                />
              </Row>
            </Section>
          </>
        )}

        {/* ============================================== */}
        {/* VIDEO                                          */}
        {/* ============================================== */}
        {block.type === "video" && (
          <>
            <Section title="Content">
              <Input
                value={d.url || ""}
                onChange={(e) => updateData("url", e.target.value)}
                placeholder="YouTube or Vimeo URL"
              />
            </Section>
            <Section title="Display">
              <Row label="Aspect">
                <Select
                  value={d.aspect || "16:9"}
                  onChange={(e) => updateData("aspect", e.target.value)}
                >
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                </Select>
              </Row>
              <Row label="Width %">
                <Input
                  type="number"
                  value={s.width ?? 100}
                  onChange={(e) =>
                    updateSettings("width", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Radius (px)">
                <Input
                  type="number"
                  value={s.radius ?? 12}
                  onChange={(e) =>
                    updateSettings("radius", Number(e.target.value))
                  }
                />
              </Row>
            </Section>
          </>
        )}

        {/* ============================================== */}
        {/* DIVIDER                                        */}
        {/* ============================================== */}
        {block.type === "divider" && (
          <Section title="Style">
            <Row label="Style">
              <Select
                value={s.style || "solid"}
                onChange={(e) => updateSettings("style", e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </Select>
            </Row>
            <Row label="Thickness">
              <Input
                type="number"
                value={s.thickness ?? 1}
                onChange={(e) =>
                  updateSettings("thickness", Number(e.target.value))
                }
              />
            </Row>
            <Row label="Width %">
              <Input
                type="number"
                value={s.width ?? 100}
                onChange={(e) =>
                  updateSettings("width", Number(e.target.value))
                }
              />
            </Row>
            <Row label="Color">
              <input
                type="color"
                value={s.color || "#e5e7eb"}
                onChange={(e) => updateSettings("color", e.target.value)}
                className="w-full h-8 rounded border border-gray-200 cursor-pointer"
              />
            </Row>
          </Section>
        )}

        {/* ============================================== */}
        {/* SPACER                                         */}
        {/* ============================================== */}
        {block.type === "spacer" && (
          <Section title="Height">
            <Input
              type="number"
              value={d.height ?? 32}
              onChange={(e) => updateData("height", Number(e.target.value))}
            />
          </Section>
        )}

        {/* ============================================== */}
        {/* TOC                                            */}
        {/* ============================================== */}
        {block.type === "toc" && (
          <Section title="Content">
            <Input
              value={d.title || ""}
              onChange={(e) => updateData("title", e.target.value)}
              placeholder="Table of Contents"
            />
            <p className="text-[10px] text-text-light">
              Automatically generates from H2/H3/H4 headings in the article.
            </p>
          </Section>
        )}

        {/* ============================================== */}
        {/* FAQ                                            */}
        {/* ============================================== */}
        {block.type === "faq" && (
          <>
            <Section title="Content">
              <Input
                value={d.title || ""}
                onChange={(e) => updateData("title", e.target.value)}
                placeholder="Frequently Asked Questions"
              />
            </Section>

            <Section title="Questions">
              <div className="space-y-3">
                {(d.items || []).map((item, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                        Q{i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveFaqItem(i, "up")}
                        disabled={i === 0}
                        className="p-1 text-gray-400 hover:text-primary disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFaqItem(i, "down")}
                        disabled={i === (d.items || []).length - 1}
                        className="p-1 text-gray-400 hover:text-primary disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => removeFaqItem(i)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Input
                      value={item.q || ""}
                      onChange={(e) => updateFaqItem(i, "q", e.target.value)}
                      placeholder="Question"
                    />
                    <MiniRichText
                      value={item.a || ""}
                      onChange={(html) => updateFaqItem(i, "a", html)}
                      placeholder="Answer (supports formatting)"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addFaqItem}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-primary/40 hover:border-primary hover:bg-[#EBF4FC] text-sm text-primary font-medium transition"
              >
                <PlusIcon className="w-4 h-4" />
                Add Question
              </button>
            </Section>

            <Section title="Display">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.defaultOpenFirst === true}
                  onChange={(e) =>
                    updateSettings("defaultOpenFirst", e.target.checked)
                  }
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-xs text-text-light">
                  Open first question by default
                </span>
              </label>
            </Section>
          </>
        )}

        {/* ============================================== */}
        {/* IMAGE / VIDEO + TEXT                           */}
        {/* ============================================== */}
        {["imageText", "textImage", "videoText", "textVideo"].includes(
          block.type,
        ) && (
          <>
            <Section title="Media">
              <Input
                value={d.media?.url || ""}
                onChange={(e) =>
                  updateData("media", {
                    ...(d.media || {}),
                    url: e.target.value,
                  })
                }
                placeholder={
                  d.media?.kind === "video" ? "YouTube/Vimeo URL" : "Image URL"
                }
              />
              {d.media?.kind !== "video" && (
                <Input
                  value={d.media?.alt || ""}
                  onChange={(e) =>
                    updateData("media", {
                      ...(d.media || {}),
                      alt: e.target.value,
                    })
                  }
                  placeholder="Alt text"
                />
              )}
            </Section>

            <Section title="Text">
              <Input
                value={d.heading || ""}
                onChange={(e) => updateData("heading", e.target.value)}
                placeholder="Optional heading"
              />
              <MiniRichText
                value={d.html || ""}
                onChange={(html) => updateData("html", html)}
                placeholder="Write the text for the other column…"
              />
              <p className="text-[10px] text-text-light">
                Enter = new paragraph · Shift+Enter = line break
              </p>
            </Section>

            <Section title="Layout">
              <Row label="Vertical align">
                <Select
                  value={s.verticalAlign || "top"}
                  onChange={(e) =>
                    updateSettings("verticalAlign", e.target.value)
                  }
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </Select>
              </Row>
              <Row label="Gap (px)">
                <Input
                  type="number"
                  value={s.gap ?? 24}
                  onChange={(e) =>
                    updateSettings("gap", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Radius (px)">
                <Input
                  type="number"
                  value={s.radius ?? 12}
                  onChange={(e) =>
                    updateSettings("radius", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Mobile order">
                <Select
                  value={s.mobileOrder || "media-first"}
                  onChange={(e) =>
                    updateSettings("mobileOrder", e.target.value)
                  }
                >
                  <option value="media-first">Media first</option>
                  <option value="text-first">Text first</option>
                </Select>
              </Row>
            </Section>
          </>
        )}

        {/* ============================================== */}
        {/* PRODUCT SHOWCASE                               */}
        {/* ============================================== */}
        {block.type === "productShowcase" && (
          <>
            <Section title="Content">
              <Input
                value={d.title || ""}
                onChange={(e) => updateData("title", e.target.value)}
                placeholder="Section title (optional)"
              />
              <button
                type="button"
                onClick={() => onOpenProductPicker(block.id)}
                className="w-full px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
              >
                {d.products?.length
                  ? `Manage Products (${d.products.length})`
                  : "Select Products"}
              </button>
              {d.products?.length > 0 && (
                <div className="space-y-1 mt-2">
                  {d.products.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="flex-1 truncate">
                        {typeof p === "object" ? p.name : "Product"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateData(
                            "products",
                            d.products.filter((_, j) => j !== i),
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Display">
              <Row label="Layout">
                <Select
                  value={d.display || "grid"}
                  onChange={(e) => updateData("display", e.target.value)}
                >
                  <option value="grid">Grid</option>
                </Select>
              </Row>
              <Row label="Desktop cols">
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={s.colsDesktop ?? 4}
                  onChange={(e) =>
                    updateSettings("colsDesktop", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Tablet cols">
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={s.colsTablet ?? 2}
                  onChange={(e) =>
                    updateSettings("colsTablet", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Mobile cols">
                <Input
                  type="number"
                  min="1"
                  max="3"
                  value={s.colsMobile ?? 2}
                  onChange={(e) =>
                    updateSettings("colsMobile", Number(e.target.value))
                  }
                />
              </Row>
              <Row label="Gap (px)">
                <Input
                  type="number"
                  value={s.gap ?? 16}
                  onChange={(e) =>
                    updateSettings("gap", Number(e.target.value))
                  }
                />
              </Row>
            </Section>
          </>
        )}
      </div>

      {/* ============================================== */}
      {/* Footer actions                                 */}
      {/* ============================================== */}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex-1 px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center gap-1"
          >
            <ArrowUpIcon className="w-3 h-3" /> Up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex-1 px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 flex items-center justify-center gap-1"
          >
            <ArrowDownIcon className="w-3 h-3" /> Down
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="flex-1 px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            <DocumentDuplicateIcon className="w-3 h-3" /> Dup
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 px-2 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 flex items-center justify-center gap-1"
          >
            <TrashIcon className="w-3 h-3" /> Del
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockSettingsPanel;
