// frontend/src/components/admin/blog/MiniRichText.jsx

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  RemoveFormatting,
  Undo,
  Redo,
  Eraser,
} from "lucide-react";

/**
 * MiniRichText
 *
 * Lightweight contentEditable-based rich text editor.
 * - Enter creates a new paragraph
 * - Shift+Enter inserts a line break (<br>)
 * - Toolbar buttons apply inline formatting (bold, italic, etc.)
 *
 * Props:
 *   value    – HTML string
 *   onChange – (html) => void
 */
const MiniRichText = ({
  value = "",
  onChange,
  placeholder = "Write your text…",
}) => {
  const ref = useRef(null);
  // Track whether the last change came from the parent (avoid cursor jump).
  const lastValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    // Only reset innerHTML when the incoming value is genuinely different
    // from what's currently in the DOM. This prevents the caret from
    // jumping to the end of the text on every keystroke.
    if (value !== lastValue.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastValue.current = html;
    if (onChange) onChange(html);
  };

  const exec = (command, arg = null) => {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    emit();
  };

  const handleInput = () => emit();
  const handleBlur = () => emit();

  const handleLink = () => {
    const url = window.prompt("Enter URL (https://…)");
    if (url) {
      const safe = /^(https?:|\/|#|mailto:|tel:)/i.test(url)
        ? url
        : `https://${url}`;
      exec("createLink", safe);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Strip formatting from pasted content — keeps it clean.
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e) => {
    // Enter → new paragraph (default behavior in contentEditable)
    // Shift+Enter → <br> (default behavior in contentEditable)
    // Both work out of the box, no override needed.
    // But we want to prevent Enter from submitting the parent <form>.
    if (e.key === "Enter") {
      // do not preventDefault — we want the newline
      e.stopPropagation();
    }
    if (e.key === "Escape") {
      ref.current?.blur();
    }
  };

  const tools = [
    { icon: Undo, cmd: "undo", title: "Undo" },
    { icon: Redo, cmd: "redo", title: "Redo" },
    { divider: true },
    { icon: Bold, cmd: "bold", title: "Bold (Ctrl+B)" },
    { icon: Italic, cmd: "italic", title: "Italic (Ctrl+I)" },
    { icon: Underline, cmd: "underline", title: "Underline (Ctrl+U)" },
    { icon: Strikethrough, cmd: "strikeThrough", title: "Strikethrough" },
    { divider: true },
    {
      icon: List,
      cmd: "insertUnorderedList",
      title: "Bullet List",
    },
    {
      icon: ListOrdered,
      cmd: "insertOrderedList",
      title: "Numbered List",
    },
    {
      icon: Quote,
      cmd: "formatBlock",
      arg: "BLOCKQUOTE",
      title: "Quote",
    },
    { divider: true },
    { icon: LinkIcon, action: handleLink, title: "Insert Link" },
    {
      icon: RemoveFormatting,
      cmd: "removeFormat",
      title: "Clear formatting",
    },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-gray-50 border-b border-gray-200">
        {tools.map((tool, i) => {
          if (tool.divider)
            return <div key={i} className="w-px h-5 bg-gray-300 mx-1" />;
          const Icon = tool.icon;
          return (
            <button
              key={i}
              type="button"
              title={tool.title}
              onMouseDown={(e) => e.preventDefault()} // keep focus in editor
              onClick={() =>
                tool.action ? tool.action() : exec(tool.cmd, tool.arg)
              }
              className="p-1.5 rounded hover:bg-white hover:shadow-sm transition text-gray-600 hover:text-primary"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editor body */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="min-h-[120px] max-h-[300px] overflow-y-auto p-3 text-sm text-text focus:outline-none
          [&_p]:mb-3 [&_p:last-child]:mb-0
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
          [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-light [&_blockquote]:my-2
          [&_a]:text-primary [&_a]:underline
          [&_strong]:font-semibold
        "
        style={{ whiteSpace: "pre-wrap" }}
      />

      {/* Placeholder for empty editor */}
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default MiniRichText;
