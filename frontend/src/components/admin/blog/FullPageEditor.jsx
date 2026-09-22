// frontend/src/components/admin/blog/FullPageEditor.jsx

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import BlogBlockRenderer from "../../blog/BlogBlockRenderer";
import BlogArticlePreview from "../../blog/BlogArticlePreview";
import BlockSettingsPanel from "./BlockSettingsPanel";
import ProductPicker from "./ProductPicker";
import {
  createBlock,
  migrateToBlocks,
  uid,
  EDITOR_LIBRARY,
} from "../../../utils/blogBlocks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FullPageEditor = ({
  value,
  onChange,
  onClose,
  title = "Edit Blog Content",
  blogMeta = {},
}) => {
  const [blocks, setBlocks] = useState(() =>
    Array.isArray(value) ? value : migrateToBlocks(value),
  );
  const [selectedId, setSelectedId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productPickerBlockId, setProductPickerBlockId] = useState(null);
  const isInternalUpdateRef = useRef(false);

  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    setBlocks(Array.isArray(value) ? value : migrateToBlocks(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const sync = (next) => {
    isInternalUpdateRef.current = true;
    setBlocks(next);
    if (onChange) onChange(next);
  };

  const addBlock = (type) => {
    const newBlock = createBlock(type);
    sync([...blocks, newBlock]);
    setSelectedId(newBlock.id);
  };

  const updateBlock = (updated) =>
    sync(blocks.map((b) => (b.id === updated.id ? updated : b)));

  const removeBlock = (id) => {
    const target = blocks.find((b) => b.id === id);
    if (!target) return;
    if (!window.confirm(`Delete this ${target.type} block?`)) return;
    sync(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateBlock = (id) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const clone = JSON.parse(JSON.stringify(blocks[idx]));
    clone.id = uid();
    const next = [...blocks];
    next.splice(idx + 1, 0, clone);
    sync(next);
    setSelectedId(clone.id);
  };

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    sync(next);
  };

  const selected = blocks.find((b) => b.id === selectedId);
  const selectedIndex = blocks.findIndex((b) => b.id === selectedId);

  const openProductPicker = (blockId) => {
    setProductPickerBlockId(blockId);
    setShowProductPicker(true);
  };

  const handleSaveProducts = (products) => {
    const next = blocks.map((b) =>
      b.id === productPickerBlockId
        ? { ...b, data: { ...b.data, products } }
        : b,
    );
    sync(next);
  };

  const hasBlocks = blocks.length > 0;

  return (
    <div className="fixed inset-0 z-[70] bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <span className="text-xs text-text-light">
            {blocks.length} block{blocks.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ Preview button now opens the SAME full user preview as BlogEditor */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition"
          >
            <XMarkIcon className="w-4 h-4" /> Done
          </button>
        </div>
      </div>

      {/* Main layout — LEFT sidebar tools, MIDDLE canvas, RIGHT settings */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT: block library */}
        <aside className="col-span-3 border-r bg-white overflow-y-auto p-4">
          <div>
            <p className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">
              Add Block
            </p>
            <div className="space-y-4">
              {EDITOR_LIBRARY.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">
                    {group.group}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => addBlock(item.type)}
                        className="text-left px-2.5 py-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-[#EBF4FC] transition"
                      >
                        <span className="text-xs font-medium text-text">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MIDDLE: canvas */}
        <div className="col-span-6 bg-gray-100 overflow-y-auto p-6">
          {!hasBlocks ? (
            <div className="text-center py-32 border-2 border-dashed border-gray-300 rounded-2xl bg-white">
              <PlusIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-light mb-1">No blocks yet</p>
              <p className="text-xs text-text-light">
                Add a block from the left sidebar
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  <div
                    onClick={() => setSelectedId(block.id)}
                    className={`relative bg-white rounded-xl border-2 transition cursor-pointer ${
                      selectedId === block.id
                        ? "border-primary shadow-md"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <div className="absolute -top-2 left-2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                      {block.type}
                    </div>
                    <div
                      className={`absolute -top-3 right-2 flex items-center gap-0.5 bg-white rounded-full shadow-md border border-gray-100 px-1 z-10 transition ${
                        selectedId === block.id
                          ? "opacity-100"
                          : "opacity-0 hover:opacity-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, "up");
                        }}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-500 hover:text-primary disabled:opacity-30"
                      >
                        <ArrowUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, "down");
                        }}
                        disabled={idx === blocks.length - 1}
                        className="p-1.5 text-gray-500 hover:text-primary disabled:opacity-30"
                      >
                        <ArrowDownIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(block.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-primary"
                      >
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-4">
                      <BlogBlockRenderer blocks={[block]} isEditor={true} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: settings panel */}
        <aside className="col-span-3 border-l bg-white overflow-y-auto p-4">
          {selected ? (
            <BlockSettingsPanel
              block={selected}
              onChange={updateBlock}
              onDelete={() => removeBlock(selected.id)}
              onDuplicate={() => duplicateBlock(selected.id)}
              onMoveUp={() => moveBlock(selected.id, "up")}
              onMoveDown={() => moveBlock(selected.id, "down")}
              canMoveUp={selectedIndex > 0}
              canMoveDown={selectedIndex < blocks.length - 1}
              onClose={() => setSelectedId(null)}
              onOpenProductPicker={openProductPicker}
            />
          ) : (
            <div className="text-center py-20">
              <p className="text-xs text-text-light">
                Select a block to edit its settings
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Product picker modal */}
      <ProductPicker
        isOpen={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        initialProducts={
          blocks.find((b) => b.id === productPickerBlockId)?.data?.products ||
          []
        }
        onSave={handleSaveProducts}
      />

      {/* ✅ Full user-facing preview — same as BlogEditor preview */}
      {showPreview && (
        <FullPreviewModal
          blocks={blocks}
          blogMeta={blogMeta}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

/**
 * FullPreviewModal
 *
 * Renders the same layout the public BlogDetail page uses.
 * Fetches related blogs + sidebar products from public endpoints
 * so the preview is 1:1 with what users see.
 */
const FullPreviewModal = ({ blocks, blogMeta, onClose }) => {
  const fakeBlog = {
    title: blogMeta.title || "Untitled Blog",
    excerpt: blogMeta.excerpt || "",
    author: blogMeta.author || "Spexxo Team",
    featuredImage: blogMeta.featuredImage || null,
    category: blogMeta.category || null,
    tags: blogMeta.tags || [],
    publishedAt: blogMeta.publishedAt || new Date(),
    readTime: blogMeta.readTime || 1,
    slug: blogMeta.slug || "preview",
  };

  const { data: relatedData } = useQuery({
    queryKey: ["preview-related-blogs"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/blogs?limit=4`);
        return data.blogs || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: productsData } = useQuery({
    queryKey: ["preview-sidebar-products"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/products?limit=3&hideOutOfStock=true`,
        );
        return data.products || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const relatedBlogs = (relatedData || [])
    .filter((b) => b.title !== fakeBlog.title)
    .slice(0, 3);

  const sidebarProducts = productsData || [];

  return (
    <div className="fixed inset-0 z-[80] bg-gray-100 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text">
            Preview — as it appears to users
          </h2>
          <p className="text-xs text-text-light">
            Desktop view · scroll to inspect · this is exactly the public page
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition"
        >
          <XMarkIcon className="w-4 h-4" /> Close Preview
        </button>
      </div>

      <div className="pt-6">
        <BlogArticlePreview
          blog={fakeBlog}
          blocks={blocks}
          relatedBlogs={relatedBlogs}
          sidebarProducts={sidebarProducts}
          isPreviewMode={true}
        />
      </div>
    </div>
  );
};

export default FullPageEditor;
