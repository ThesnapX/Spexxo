// frontend/src/components/admin/SearchableMultiSelect.jsx

import { useState, useRef, useEffect } from "react";
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const SearchableMultiSelect = ({
  label,
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Search...",
  maxHeight = "max-h-40",
  renderOption = (item) => item.name || item,
  getValue = (item) => item._id || item,
  creatable = false,
  onCreateNew = null,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function to get display text for search
  const getDisplayText = (item) => {
    const result = renderOption(item);
    // If renderOption returns a React element, extract the text content
    if (typeof result === "object" && result !== null) {
      // For color swatch elements, extract the color name from the children
      if (result.props?.children) {
        // If children is an array (span with swatch and name)
        if (Array.isArray(result.props.children)) {
          // Find the text node in the children
          for (const child of result.props.children) {
            if (typeof child === "string") return child;
            if (
              child?.props?.children &&
              typeof child.props.children === "string"
            ) {
              return child.props.children;
            }
          }
        }
        // If children is a string directly
        if (typeof result.props.children === "string") {
          return result.props.children;
        }
      }
      // Fallback: try to get name or string representation
      return item.name || String(item);
    }
    // If renderOption returns a string directly
    return String(result || "");
  };

  // Live search - filter options based on search input
  const filteredOptions = options.filter((opt) => {
    const displayText = getDisplayText(opt).toLowerCase();
    return displayText.includes(search.toLowerCase());
  });

  const handleToggle = (item) => {
    const val = getValue(item);
    const current = Array.isArray(selectedValues) ? selectedValues : [];
    const newValues = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    onChange(newValues);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleRemove = (val, e) => {
    e.stopPropagation();
    const current = Array.isArray(selectedValues) ? selectedValues : [];
    onChange(current.filter((v) => v !== val));
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(getValue(opt)))
    .map((opt) => renderOption(opt));

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && search.trim() && creatable && onCreateNew) {
      onCreateNew(search.trim());
      setSearch("");
      setIsOpen(false);
    }
  };

  // Get color swatch for display in dropdown
  const getColorSwatch = (opt) => {
    if (opt.hexCode) {
      return (
        <span
          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: opt.hexCode || "#000" }}
        />
      );
    }
    return null;
  };

  // Check if an option has a color (for displaying swatch in selected pills)
  const hasColor = (opt) => {
    return opt.hexCode !== undefined;
  };

  // Get label text for display
  const getLabelText = (label) => {
    if (typeof label === "string") return label;
    if (typeof label === "object" && label !== null) {
      if (label.props?.children) {
        if (Array.isArray(label.props.children)) {
          for (const child of label.props.children) {
            if (typeof child === "string") return child;
          }
        }
        if (typeof label.props.children === "string") {
          return label.props.children;
        }
      }
    }
    return String(label || "");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <div
        className={`border rounded-lg transition-all duration-200 ${
          isOpen
            ? "border-primary ring-2 ring-primary/20 shadow-sm"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <div className="flex flex-wrap items-center gap-1.5 p-2 min-h-[42px]">
          {/* Selected items as pills */}
          {selectedLabels.map((label, idx) => {
            const val = selectedValues[idx];
            const labelText = getLabelText(label);

            // Find the original option to get color if needed
            const originalOpt = options.find((opt) => getValue(opt) === val);
            const hasColorSwatch = originalOpt?.hexCode;

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EBF4FC] text-primary rounded-full text-xs font-medium border border-primary/20"
              >
                {hasColorSwatch && (
                  <span
                    className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: hasColorSwatch }}
                  />
                )}
                <span className="max-w-[120px] truncate">{labelText}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(val, e)}
                  className="hover:text-red-500 transition-colors rounded-full hover:bg-red-50 p-0.5"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedLabels.length === 0 ? placeholder : ""}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[80px] outline-none text-sm bg-transparent py-1 px-1"
            autoComplete="off"
          />
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown with live search results */}
      {isOpen && (
        <div
          className={`absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ${maxHeight}`}
        >
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-light">
                {creatable && onCreateNew && search.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateNew(search.trim());
                      setSearch("");
                      setIsOpen(false);
                    }}
                    className="text-primary hover:underline flex items-center gap-1 justify-center"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create "{search.trim()}"
                  </button>
                ) : (
                  <span>No options found</span>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const val = getValue(opt);
                const isSelected = selectedValues.includes(val);
                const displayLabel = renderOption(opt);
                const labelText = getLabelText(displayLabel);
                const colorSwatch = getColorSwatch(opt);

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleToggle(opt)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      isSelected ? "bg-[#EBF4FC] text-primary" : "text-text"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    {colorSwatch}
                    <span className="flex-1">{labelText}</span>
                    {isSelected && (
                      <span className="text-xs text-primary font-medium">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          {filteredOptions.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-xs text-text-light flex justify-between">
              <span>{filteredOptions.length} options</span>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChange([]);
                    setIsOpen(false);
                  }}
                  className="text-red-500 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableMultiSelect;
