// frontend/src/components/admin/blog/KeywordsInput.jsx

import { useState, useRef, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * KeywordsInput
 *
 * Pill-style keyword input, similar to YouTube tags.
 *
 * Props:
 *   value       – comma-separated string (e.g. "eyeglasses, sunglasses")
 *   onChange    – (newCommaSeparatedString) => void
 *   label       – optional label
 *   placeholder – input placeholder
 *   hint        – helper text below
 */
const KeywordsInput = ({
  value = "",
  onChange,
  label,
  placeholder = "Add a keyword…",
  hint,
}) => {
  // Internal array of pills derived from the comma-separated value.
  const [keywords, setKeywords] = useState(() => parseKeywords(value));
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  // Sync from parent when `value` changes externally (e.g. edit form loads).
  useEffect(() => {
    const parsed = parseKeywords(value);
    // Only replace if it's actually different from what we have.
    const current = keywords.join(", ");
    const incoming = parsed.join(", ");
    if (current !== incoming) {
      setKeywords(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next) => {
    // Deduplicate (case-insensitive), preserve order.
    const seen = new Set();
    const deduped = [];
    for (const k of next) {
      const key = k.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(k.trim());
    }
    setKeywords(deduped);
    if (onChange) onChange(deduped.join(", "));
  };

  const addKeyword = (raw) => {
    const parts = String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    commit([...keywords, ...parts]);
    setInput("");
  };

  const removeKeyword = (index) => {
    const next = keywords.filter((_, i) => i !== index);
    commit(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addKeyword(input);
    } else if (e.key === "Backspace" && !input && keywords.length > 0) {
      // Delete last pill when backspacing an empty input — YouTube-like UX.
      removeKeyword(keywords.length - 1);
    }
  };

  const handleBlur = () => {
    // Commit any pending text as a keyword on blur.
    if (input.trim()) addKeyword(input);
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (text && text.includes(",")) {
      e.preventDefault();
      addKeyword(text);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}

      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full min-h-[46px] px-3 py-2 border border-gray-200 rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition cursor-text flex flex-wrap items-center gap-1.5 bg-white"
      >
        {keywords.map((kw, i) => (
          <span
            key={`${kw}-${i}`}
            className="inline-flex items-center gap-1 bg-[#EBF4FC] text-primary text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {kw}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeKeyword(i);
              }}
              className="hover:text-red-500 transition"
              aria-label={`Remove keyword ${kw}`}
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            // If user types or pastes a comma, split immediately.
            if (v.includes(",")) {
              const beforeComma = v.split(",");
              const rest = beforeComma.pop();
              beforeComma.forEach((p) => p.trim() && addKeyword(p));
              setInput(rest);
            } else {
              setInput(v);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={keywords.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] outline-none bg-transparent text-sm border-none focus:ring-0 p-0 m-0"
          autoComplete="off"
        />
      </div>

      {hint && <p className="text-xs text-text-light mt-1">{hint}</p>}

      {keywords.length > 0 && (
        <p className="text-xs text-text-light mt-1">
          {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

const parseKeywords = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export default KeywordsInput;
