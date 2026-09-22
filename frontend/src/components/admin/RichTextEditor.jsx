// frontend/src/components/admin/RichTextEditor.jsx

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write your blog content...",
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command, arg = null) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (onChange) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (onChange) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const tools = [
    { icon: Undo, cmd: "undo", title: "Undo" },
    { icon: Redo, cmd: "redo", title: "Redo" },
    { divider: true },
    { icon: Heading1, cmd: "formatBlock", arg: "H1", title: "Heading 1" },
    { icon: Heading2, cmd: "formatBlock", arg: "H2", title: "Heading 2" },
    { icon: Heading3, cmd: "formatBlock", arg: "H3", title: "Heading 3" },
    { divider: true },
    { icon: Bold, cmd: "bold", title: "Bold" },
    { icon: Italic, cmd: "italic", title: "Italic" },
    { icon: Underline, cmd: "underline", title: "Underline" },
    { divider: true },
    { icon: List, cmd: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered List" },
    { icon: Quote, cmd: "formatBlock", arg: "BLOCKQUOTE", title: "Quote" },
    { divider: true },
    { icon: AlignLeft, cmd: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, cmd: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, cmd: "justifyRight", title: "Align Right" },
    { divider: true },
    { icon: LinkIcon, action: handleLink, title: "Insert Link" },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {tools.map((tool, i) => {
          if (tool.divider) {
            return <div key={i} className="w-px h-5 bg-gray-300 mx-1" />;
          }
          const Icon = tool.icon;
          return (
            <button
              key={i}
              type="button"
              title={tool.title}
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

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 prose prose-sm max-w-none focus:outline-none"
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        [contenteditable] h2 { font-size: 1.4rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        [contenteditable] h3 { font-size: 1.15rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        [contenteditable] p { margin: 0.5rem 0; line-height: 1.7; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] ul { list-style: disc; }
        [contenteditable] ol { list-style: decimal; }
        [contenteditable] blockquote { border-left: 4px solid #3D96EB; padding-left: 1rem; color: #4b5563; margin: 0.75rem 0; font-style: italic; }
        [contenteditable] a { color: #3D96EB; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
