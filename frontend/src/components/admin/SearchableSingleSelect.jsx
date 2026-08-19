// frontend/src/components/admin/SearchableSingleSelect.jsx

import { useState, useRef, useEffect } from "react";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const SearchableSingleSelect = ({
  label,
  options = [],
  value = "",
  onChange,
  placeholder = "Search...",
  renderOption = (item) => item.name || item,
  getValue = (item) => item._id || item,
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
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search - filter options based on search input
  const filteredOptions = options.filter((opt) =>
    String(renderOption(opt)).toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabel = options.find((opt) => getValue(opt) === value);
  const selectedLabelText = selectedLabel ? renderOption(selectedLabel) : "";

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
    setTimeout(() => inputRef.current?.blur(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && filteredOptions.length === 1) {
      handleSelect(getValue(filteredOptions[0]));
    }
  };

  const displayLabel = (item) => {
    const result = renderOption(item);
    return typeof result === "string" ? result : result?.props?.children || "";
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <div
        className={`border rounded-lg transition-all duration-200 cursor-pointer ${
          isOpen
            ? "border-primary ring-2 ring-primary/20 shadow-sm"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <div className="flex items-center gap-2 p-2 min-h-[42px]">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              value && selectedLabel ? displayLabel(selectedLabel) : placeholder
            }
            value={isOpen ? search : ""}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-sm bg-transparent py-1 px-1"
            autoComplete="off"
          />
          {value && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown with live search results */}
      {isOpen && (
        <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                !value ? "bg-[#EBF4FC] text-primary" : "text-text"
              }`}
            >
              <span
                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  !value ? "border-primary" : "border-gray-300"
                }`}
              >
                {!value && (
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                )}
              </span>
              <span className="flex-1">None</span>
              {!value && (
                <span className="text-xs text-primary font-medium">
                  Selected
                </span>
              )}
            </button>
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-light">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const val = getValue(opt);
                const isSelected = value === val;
                const labelText = displayLabel(opt);

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelect(val)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      isSelected ? "bg-[#EBF4FC] text-primary" : "text-text"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "border-primary" : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </span>
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
              {value && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className="text-red-500 hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSingleSelect;
