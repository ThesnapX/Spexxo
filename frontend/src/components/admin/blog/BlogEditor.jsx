// frontend/src/components/admin/blog/BlogEditor.jsx

import { useState, useEffect, useRef } from "react";
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import BlogBlockRenderer from "../../blog/BlogBlockRenderer";
import BlogArticlePreview from "../../blog/BlogArticlePreview";
import BlockPicker from "./BlockPicker";
import BlockSettingsPanel from "./BlockSettingsPanel";
import ProductPicker from "./ProductPicker";
import FullPageEditor from "./FullPageEditor";
import { createBlock, migrateToBlocks, uid } from "../../../utils/blogBlocks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BlogEditor = ({ value, onChange, blogMeta = {} }) => {
  const [blocks, setBlocks] = useState(() =>
    Array.isArray(value) ? value : migrateToBlocks(value),
  );
  const [selectedId, setSelectedId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInsertIndex, setPickerInsertIndex] = useState(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productPickerBlockId, setProductPickerBlockId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullPage, setShowFullPage] = useState(false);
  const isInternalUpdateRef = useRef(false);

  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (Array.isArray(value)) {
      setBlocks(value);
    } else {
      setBlocks(migrateToBlocks(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const sync = (next) => {
    isInternalUpdateRef.current = true;
    setBlocks(next);
    if (onChange) onChange(next);
  };

  const openPickerAt = (index = null) => {
    setPickerInsertIndex(index);
    setShowPicker(true);
  };

  const handlePickBlock = (type) => {
    const newBlock = createBlock(type);
    const next = [...blocks];
    if (pickerInsertIndex == null || pickerInsertIndex >= next.length) {
      next.push(newBlock);
    } else {
      next.splice(pickerInsertIndex, 0, newBlock);
    }
    sync(next);
    setSelectedId(newBlock.id);
    setPickerInsertIndex(null);
  };

  const updateBlock = (updated) => {
    sync(blocks.map((b) => (b.id === updated.id ? updated : b)));
  };

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

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-text-light">
          {blocks.length} block{blocks.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          {/* ✅ type="button" so it never submits the parent form */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            title="Preview as it appears to users"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setShowFullPage(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            title="Open full-page editor"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
            Full Page
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 min-h-[500px]">
        {/* Canvas */}
        <div className="col-span-12 lg:col-span-8 p-4 bg-gray-50 max-h-[700px] overflow-y-auto">
          {blocks.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-white">
              <PlusIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-text-light mb-1">No blocks yet</p>
              {/* ✅ type="button" */}
              <button
                type="button"
                onClick={() => openPickerAt(null)}
                className="mt-3 btn-primary text-sm"
              >
                Add First Block
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <InsertBtn onClick={() => openPickerAt(0)} />

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
                      {/* ✅ type="button" on every one of these */}
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

                  <InsertBtn onClick={() => openPickerAt(idx + 1)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="col-span-12 lg:col-span-4 border-l bg-white p-4 max-h-[700px] overflow-y-auto">
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
              <p className="text-sm text-text-light">
                Select a block to edit its settings
              </p>
              <p className="text-xs text-text-light mt-1">
                or click + to add a new block
              </p>
            </div>
          )}
        </div>
      </div>

      <BlockPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={handlePickBlock}
      />

      <ProductPicker
        isOpen={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        initialProducts={
          blocks.find((b) => b.id === productPickerBlockId)?.data?.products ||
          []
        }
        onSave={handleSaveProducts}
      />

      {showFullPage && (
        <FullPageEditor
          value={blocks}
          onChange={sync}
          onClose={() => setShowFullPage(false)}
        />
      )}

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

// ✅ type="button" here too — the insert button is inside the parent form
const InsertBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full group py-1 flex items-center justify-center hover:py-2 transition-all"
  >
    <div className="w-full border-t-2 border-dashed border-transparent group-hover:border-primary flex items-center justify-center relative">
      <span className="absolute bg-primary text-white text-[10px] font-medium rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
        <PlusIcon className="w-3 h-3" /> Insert here
      </span>
    </div>
  </button>
);

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
        {/* ✅ type="button" */}
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

export default BlogEditor;
