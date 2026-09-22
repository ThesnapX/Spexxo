// frontend/src/components/admin/blog/BlockSettings.jsx

import {
  XMarkIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-text-light mb-1">
      {label}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
  >
    {children}
  </select>
);

const ColorInput = ({ value, onChange }) => (
  <div className="flex gap-2">
    <input
      type="color"
      value={value || "#000000"}
      onChange={(e) => onChange(e.target.value)}
      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
    />
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
    />
  </div>
);

const BlockSettings = ({ block, onChange, onDelete, onDuplicate, onClose }) => {
  if (!block) return null;

  const updateData = (key, value) =>
    onChange({ ...block, data: { ...block.data, [key]: value } });

  const updateSetting = (key, value) =>
    onChange({
      ...block,
      settings: { ...(block.settings || {}), [key]: value },
    });

  return (
    <div className="bg-white rounded-xl border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <p className="text-xs text-text-light uppercase tracking-wider">
            Block Settings
          </p>
          <h3 className="text-sm font-semibold text-text capitalize">
            {block.type.replace("-", " ")}
          </h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= BLOCK-SPECIFIC ================= */}

        {block.type === "heading" && (
          <>
            <Field label="Heading Level">
              <Select
                value={block.data.level || 2}
                onChange={(e) => updateData("level", Number(e.target.value))}
              >
                <option value={1}>H1 — Largest</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
                <option value={4}>H4</option>
              </Select>
            </Field>
            <Field label="Text">
              <Input
                value={block.data.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
                placeholder="Heading text..."
              />
            </Field>
          </>
        )}

        {block.type === "paragraph" && (
          <>
            <Field label="Text (HTML allowed)">
              <Textarea
                rows={8}
                value={block.data.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
                placeholder="Write your paragraph... <strong>bold</strong>, <em>italic</em>, <a href='#'>link</a>"
              />
            </Field>
            <Field label="Font Size (px)">
              <Input
                type="number"
                value={block.settings?.fontSize || 16}
                onChange={(e) =>
                  updateSetting("fontSize", Number(e.target.value))
                }
                min="10"
                max="32"
              />
            </Field>
          </>
        )}

        {block.type === "image" && (
          <>
            <Field label="Image URL">
              <Input
                value={block.data.url || ""}
                onChange={(e) => updateData("url", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Alt Text">
              <Input
                value={block.data.alt || ""}
                onChange={(e) => updateData("alt", e.target.value)}
              />
            </Field>
            <Field label="Caption (optional)">
              <Input
                value={block.data.caption || ""}
                onChange={(e) => updateData("caption", e.target.value)}
              />
            </Field>
            <Field label="Width (%)">
              <Input
                type="number"
                value={block.settings?.width || 100}
                onChange={(e) => updateSetting("width", Number(e.target.value))}
                min="10"
                max="100"
              />
            </Field>
          </>
        )}

        {block.type === "image-text" && (
          <>
            <Field label="Layout">
              <Select
                value={block.settings?.layout || "image-left"}
                onChange={(e) => updateSetting("layout", e.target.value)}
              >
                <option value="image-left">Image Left, Text Right</option>
                <option value="image-right">Image Right, Text Left</option>
              </Select>
            </Field>
            <Field label="Image URL">
              <Input
                value={block.data.imageUrl || ""}
                onChange={(e) => updateData("imageUrl", e.target.value)}
              />
            </Field>
            <Field label="Heading">
              <Input
                value={block.data.heading || ""}
                onChange={(e) => updateData("heading", e.target.value)}
              />
            </Field>
            <Field label="Text (HTML allowed)">
              <Textarea
                rows={6}
                value={block.data.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
              />
            </Field>
          </>
        )}

        {block.type === "list" && (
          <>
            <Field label="List Type">
              <Select
                value={block.data.ordered ? "ordered" : "unordered"}
                onChange={(e) =>
                  updateData("ordered", e.target.value === "ordered")
                }
              >
                <option value="unordered">Bullet (•)</option>
                <option value="ordered">Numbered (1.)</option>
              </Select>
            </Field>
            <Field label="Items (one per line)">
              <Textarea
                rows={6}
                value={(block.data.items || []).join("\n")}
                onChange={(e) =>
                  updateData(
                    "items",
                    e.target.value.split("\n").filter((line) => line.trim()),
                  )
                }
              />
            </Field>
          </>
        )}

        {block.type === "quote" && (
          <>
            <Field label="Quote Text">
              <Textarea
                rows={4}
                value={block.data.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
              />
            </Field>
            <Field label="Author (optional)">
              <Input
                value={block.data.author || ""}
                onChange={(e) => updateData("author", e.target.value)}
              />
            </Field>
            <Field label="Border Color">
              <ColorInput
                value={block.settings?.borderColor || "#3D96EB"}
                onChange={(v) => updateSetting("borderColor", v)}
              />
            </Field>
          </>
        )}

        {block.type === "callout" && (
          <>
            <Field label="Variant">
              <Select
                value={block.data.variant || "info"}
                onChange={(e) => updateData("variant", e.target.value)}
              >
                <option value="info">Info (blue)</option>
                <option value="success">Success (green)</option>
                <option value="warning">Warning (yellow)</option>
                <option value="error">Error (red)</option>
              </Select>
            </Field>
            <Field label="Title (optional)">
              <Input
                value={block.data.title || ""}
                onChange={(e) => updateData("title", e.target.value)}
              />
            </Field>
            <Field label="Text">
              <Textarea
                rows={3}
                value={block.data.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
              />
            </Field>
          </>
        )}

        {block.type === "divider" && (
          <>
            <Field label="Style">
              <Select
                value={block.settings?.style || "solid"}
                onChange={(e) => updateSetting("style", e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </Select>
            </Field>
            <Field label="Thickness (px)">
              <Input
                type="number"
                min="1"
                max="10"
                value={block.settings?.thickness || 1}
                onChange={(e) =>
                  updateSetting("thickness", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Color">
              <ColorInput
                value={block.settings?.borderColor || "#e5e7eb"}
                onChange={(v) => updateSetting("borderColor", v)}
              />
            </Field>
          </>
        )}

        {block.type === "spacer" && (
          <Field label="Height (px)">
            <Input
              type="number"
              min="8"
              max="200"
              value={block.data.height || 40}
              onChange={(e) => updateData("height", Number(e.target.value))}
            />
          </Field>
        )}

        {block.type === "button" && (
          <>
            <Field label="Button Text">
              <Input
                value={block.data.text || ""}
                onChange={(e) => updateData("text", e.target.value)}
              />
            </Field>
            <Field label="URL">
              <Input
                value={block.data.url || ""}
                onChange={(e) => updateData("url", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Background Color">
              <ColorInput
                value={block.data.bgColor || "#3D96EB"}
                onChange={(v) => updateData("bgColor", v)}
              />
            </Field>
            <Field label="Text Color">
              <ColorInput
                value={block.data.textColor || "#ffffff"}
                onChange={(v) => updateData("textColor", v)}
              />
            </Field>
          </>
        )}

        {block.type === "embed" && (
          <Field label="YouTube / URL">
            <Input
              value={block.data.url || ""}
              onChange={(e) => updateData("url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </Field>
        )}

        {block.type === "gallery" && (
          <>
            <Field label="Columns">
              <Select
                value={block.settings?.columns || 3}
                onChange={(e) =>
                  updateSetting("columns", Number(e.target.value))
                }
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </Select>
            </Field>
            <Field label="Images (one URL per line)">
              <Textarea
                rows={6}
                value={(block.data.images || []).map((i) => i.url).join("\n")}
                onChange={(e) =>
                  updateData(
                    "images",
                    e.target.value
                      .split("\n")
                      .filter((l) => l.trim())
                      .map((url) => ({ url: url.trim() })),
                  )
                }
              />
            </Field>
          </>
        )}

        {block.type === "two-column" && (
          <>
            <Field label="Left Column (HTML)">
              <Textarea
                rows={5}
                value={block.data.left || ""}
                onChange={(e) => updateData("left", e.target.value)}
              />
            </Field>
            <Field label="Right Column (HTML)">
              <Textarea
                rows={5}
                value={block.data.right || ""}
                onChange={(e) => updateData("right", e.target.value)}
              />
            </Field>
          </>
        )}

        {block.type === "table" && (
          <>
            <Field label="Headers (comma separated)">
              <Input
                value={(block.data.headers || []).join(", ")}
                onChange={(e) =>
                  updateData(
                    "headers",
                    e.target.value.split(",").map((h) => h.trim()),
                  )
                }
                placeholder="Name, Price, Stock"
              />
            </Field>
            <Field label="Rows (one per line, cells comma separated)">
              <Textarea
                rows={6}
                value={(block.data.rows || [])
                  .map((r) => r.join(", "))
                  .join("\n")}
                onChange={(e) =>
                  updateData(
                    "rows",
                    e.target.value
                      .split("\n")
                      .filter((l) => l.trim())
                      .map((line) => line.split(",").map((c) => c.trim())),
                  )
                }
              />
            </Field>
          </>
        )}

        {block.type === "code" && (
          <Field label="Code">
            <Textarea
              rows={8}
              value={block.data.code || ""}
              onChange={(e) => updateData("code", e.target.value)}
              placeholder="Paste your code here..."
              style={{ fontFamily: "monospace" }}
            />
          </Field>
        )}

        {/* ================= SHARED STYLES ================= */}
        <div className="border-t pt-4 space-y-4">
          <p className="text-xs font-semibold text-text-light uppercase tracking-wider">
            Block Styles
          </p>

          {/* Alignment (only for text-ish blocks) */}
          {["heading", "paragraph", "image", "button"].includes(block.type) && (
            <Field label="Alignment">
              <Select
                value={block.settings?.align || "left"}
                onChange={(e) => updateSetting("align", e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </Select>
            </Field>
          )}

          <Field label="Background Color">
            <ColorInput
              value={block.settings?.background || ""}
              onChange={(v) => updateSetting("background", v)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Padding Top">
              <Input
                type="number"
                min="0"
                value={block.settings?.paddingTop ?? 8}
                onChange={(e) =>
                  updateSetting("paddingTop", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Padding Bottom">
              <Input
                type="number"
                min="0"
                value={block.settings?.paddingBottom ?? 8}
                onChange={(e) =>
                  updateSetting("paddingBottom", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Margin Top">
              <Input
                type="number"
                min="0"
                value={block.settings?.marginTop ?? 0}
                onChange={(e) =>
                  updateSetting("marginTop", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Margin Bottom">
              <Input
                type="number"
                min="0"
                value={block.settings?.marginBottom ?? 0}
                onChange={(e) =>
                  updateSetting("marginBottom", Number(e.target.value))
                }
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t p-3 flex gap-2">
        <button
          onClick={onDuplicate}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <DocumentDuplicateIcon className="w-4 h-4" /> Duplicate
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
        >
          <TrashIcon className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
};

export default BlockSettings;
