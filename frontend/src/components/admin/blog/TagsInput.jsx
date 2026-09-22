// frontend/src/components/admin/blog/TagsInput.jsx

import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * TagsInput
 *
 * Multi-select tag picker with:
 *  - Search box (filters existing tags)
 *  - Inline creation (Enter or "Create <x>" button)
 *  - Selected tags shown first (always visible)
 *  - Unselected tags collapsed behind "Show more"
 */
const TagsInput = ({
  label = "Tags",
  selectedIds = [],
  availableTags = [],
  onChange,
  collapseThreshold = 8,
}) => {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  // Reset search when the parent clears selection (e.g. on new blog)
  useEffect(() => {
    setQuery("");
  }, [availableTags.length]);

  // ── Create tag mutation ──
  const createMutation = useMutation({
    mutationFn: async (name) => {
      const { data } = await axios.post(
        `${API_URL}/blogs/tags`,
        { name: name.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return data.tag;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags-all"] });
      // Auto-select the newly created tag
      onChange([...selectedIds, newTag._id]);
      setQuery("");
      toast.success(`Tag "${newTag.name}" created`);
    },
    onError: (e) => {
      const msg = e.response?.data?.message || "Failed to create tag";
      // Handle duplicate-name error gracefully
      if (msg.toLowerCase().includes("duplicate")) {
        toast.error("A tag with this name already exists");
      } else {
        toast.error(msg);
      }
    },
  });

  // ── Filtered tags ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTags, query]);

  // ── Split into selected / unselected ──
  const selectedTags = availableTags.filter((t) => selectedIds.includes(t._id));
  const unselectedTags = filtered.filter((t) => !selectedIds.includes(t._id));

  const shouldCollapse = unselectedTags.length > collapseThreshold && !expanded;
  const visibleUnselected = shouldCollapse
    ? unselectedTags.slice(0, collapseThreshold)
    : unselectedTags;

  // ── Exact-match check for create button ──
  const trimmedQuery = query.trim();
  const exactMatch = trimmedQuery
    ? availableTags.some(
        (t) => t.name.toLowerCase() === trimmedQuery.toLowerCase(),
      )
    : false;
  const canCreate = trimmedQuery.length >= 2 && !exactMatch;

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (id) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const handleCreate = () => {
    if (!canCreate) return;
    createMutation.mutate(trimmedQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length === 1 && !canCreate) {
        // If exactly one match and no create intent, select it
        handleToggle(filtered[0]._id);
        setQuery("");
      } else if (canCreate) {
        handleCreate();
      }
    }
    if (e.key === "Backspace" && !query && selectedIds.length > 0) {
      // Remove last selected tag on backspace
      handleRemove(selectedIds[selectedIds.length - 1]);
    }
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}{" "}
          {selectedIds.length > 0 && (
            <span className="text-xs text-text-light font-normal">
              ({selectedIds.length} selected)
            </span>
          )}
        </label>
      )}

      {/* Selected tags as chips */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag._id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs font-medium rounded-full"
            >
              #{tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag._id)}
                className="hover:bg-white/20 rounded-full p-0.5 transition"
                aria-label={`Remove tag ${tag.name}`}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search box */}
      <div className="relative mb-3">
        <TagIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search tags, or type new name and press Enter…"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Create hint */}
      {canCreate && (
        <button
          type="button"
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="w-full mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-primary/40 hover:border-primary hover:bg-[#EBF4FC] text-sm text-primary font-medium transition disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          {createMutation.isPending
            ? "Creating…"
            : `Create tag "${trimmedQuery}"`}
        </button>
      )}

      {/* No tags at all */}
      {availableTags.length === 0 && !canCreate && (
        <p className="text-xs text-text-light italic">
          No tags yet. Type a name above to create your first tag.
        </p>
      )}

      {/* Unselected tags as toggleable pills */}
      {unselectedTags.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {visibleUnselected.map((tag) => (
              <button
                key={tag._id}
                type="button"
                onClick={() => handleToggle(tag._id)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition border bg-gray-50 text-text-light border-gray-200 hover:bg-[#EBF4FC] hover:text-primary hover:border-primary/40"
              >
                #{tag.name}
              </button>
            ))}
          </div>

          {/* Show more / less toggle */}
          {unselectedTags.length > collapseThreshold && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <ChevronDownIcon
                className={`w-3.5 h-3.5 transition ${expanded ? "rotate-180" : ""}`}
              />
              {expanded
                ? "Show less"
                : `Show more (${unselectedTags.length - collapseThreshold})`}
            </button>
          )}
        </>
      )}

      {/* No matches */}
      {filtered.length === 0 && query.trim() && !canCreate && (
        <p className="text-xs text-text-light italic">
          No tags match "{query}"
        </p>
      )}
    </div>
  );
};

export default TagsInput;
