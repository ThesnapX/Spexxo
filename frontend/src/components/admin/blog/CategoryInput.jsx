// frontend/src/components/admin/blog/CategoryInput.jsx

import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  FolderIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * CategoryInput
 *
 * Single-select category picker with:
 *  - Search box (opens on focus)
 *  - Inline creation (Enter or "Create <x>")
 *  - Clear selection
 */
const CategoryInput = ({
  label = "Category",
  selectedId = "",
  availableCategories = [],
  onChange,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Create category mutation ──
  const createMutation = useMutation({
    mutationFn: async (name) => {
      const { data } = await axios.post(
        `${API_URL}/blogs/categories`,
        { name: name.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return data.category;
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories-all"] });
      onChange(newCat._id);
      setQuery("");
      setIsOpen(false);
      toast.success(`Category "${newCat.name}" created`);
    },
    onError: (e) => {
      const msg = e.response?.data?.message || "Failed to create category";
      if (msg.toLowerCase().includes("duplicate")) {
        toast.error("A category with this name already exists");
      } else {
        toast.error(msg);
      }
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableCategories;
    return availableCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [availableCategories, query]);

  const selected = availableCategories.find((c) => c._id === selectedId);

  const trimmedQuery = query.trim();
  const exactMatch = trimmedQuery
    ? availableCategories.some(
        (c) => c.name.toLowerCase() === trimmedQuery.toLowerCase(),
      )
    : false;
  const canCreate = trimmedQuery.length >= 2 && !exactMatch;

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length === 1 && !canCreate) {
        handleSelect(filtered[0]._id);
      } else if (canCreate) {
        createMutation.mutate(trimmedQuery);
      }
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}

      {/* Trigger / input */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`w-full min-h-[42px] px-3 py-2 border rounded-lg flex items-center gap-2 cursor-text transition ${
          isOpen
            ? "border-primary ring-1 ring-primary/20"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {selected && !isOpen ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EBF4FC] text-primary text-xs font-medium rounded-full">
            <FolderIcon className="w-3 h-3" />
            {selected.name}
            <button
              type="button"
              onClick={handleClear}
              className="hover:bg-primary/20 rounded-full p-0.5 transition"
              aria-label="Clear category"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected ? "" : "Search categories, or type new name…"}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm border-none focus:ring-0 p-0"
          />
        )}
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {/* "None" option */}
          {!query.trim() && (
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                !selectedId ? "bg-[#EBF4FC] text-primary" : "text-text"
              }`}
            >
              <span className="w-4 h-4" />
              <span className="flex-1">No category</span>
              {!selectedId && <CheckIcon className="w-4 h-4" />}
            </button>
          )}

          {/* Create option */}
          {canCreate && (
            <button
              type="button"
              onClick={() => createMutation.mutate(trimmedQuery)}
              disabled={createMutation.isPending}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#EBF4FC] text-primary font-medium flex items-center gap-2 border-b border-gray-100 disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4" />
              {createMutation.isPending
                ? "Creating…"
                : `Create category "${trimmedQuery}"`}
            </button>
          )}

          {/* List */}
          {filtered.length === 0 && !canCreate ? (
            <div className="px-3 py-4 text-xs text-text-light italic text-center">
              {query.trim()
                ? `No categories match "${query}"`
                : "No categories yet"}
            </div>
          ) : (
            filtered.map((cat) => {
              const isSelected = cat._id === selectedId;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleSelect(cat._id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    isSelected ? "bg-[#EBF4FC] text-primary" : "text-text"
                  }`}
                >
                  <FolderIcon className="w-4 h-4 text-gray-400" />
                  <span className="flex-1">{cat.name}</span>
                  {isSelected && <CheckIcon className="w-4 h-4" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryInput;
