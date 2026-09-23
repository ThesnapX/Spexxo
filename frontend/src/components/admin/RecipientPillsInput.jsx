// frontend/src/components/admin/RecipientPillsInput.jsx

import { useState, useRef, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const RecipientPillsInput = ({ value = [], onChange, placeholder }) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // External value sync (only if differs)
  useEffect(() => {
    // Nothing to do — we keep local state as source of truth on change
  }, []);

  const commit = (raw) => {
    const parts = String(raw)
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    const seen = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    let hasError = false;

    for (const email of parts) {
      const lower = email.toLowerCase();
      if (!EMAIL_REGEX.test(lower)) {
        hasError = true;
        continue;
      }
      if (seen.has(lower)) continue;
      seen.add(lower);
      next.push(lower);
    }

    if (hasError) {
      setError("Some entries were not valid emails and were skipped.");
      setTimeout(() => setError(""), 3000);
    }

    if (next.length !== value.length) onChange(next);
    setInput("");
  };

  const remove = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (input.trim()) commit(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value.length - 1);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (text && /[,;\s]/.test(text)) {
      e.preventDefault();
      commit(text);
    }
  };

  const handleBlur = () => {
    if (input.trim()) commit(input);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full min-h-[46px] px-3 py-2 border border-gray-200 rounded-lg flex flex-wrap items-center gap-1.5 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition cursor-text"
      >
        {value.map((email, i) => (
          <span
            key={`${email}-${i}`}
            className="inline-flex items-center gap-1 bg-[#EBF4FC] text-primary text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
              className="hover:text-red-500 transition"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={
            value.length === 0 ? placeholder || "Type email & press Enter…" : ""
          }
          className="flex-1 min-w-[160px] outline-none bg-transparent text-sm border-none focus:ring-0 p-0 m-0"
          autoComplete="off"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-text-light mt-1">
        {value.length} recipient{value.length !== 1 ? "s" : ""} · Press Enter or
        comma to add
      </p>
    </div>
  );
};

export default RecipientPillsInput;
