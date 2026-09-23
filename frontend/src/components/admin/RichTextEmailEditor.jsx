// frontend/src/components/admin/RichTextEmailEditor.jsx

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
  Image as ImageIcon,
  Minus,
  Code,
} from "lucide-react";

const RichTextEmailEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command, arg = null) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    emit();
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL (https://…):");
    if (url) exec("createLink", url);
  };

  const handleImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) exec("insertImage", url);
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
    { icon: List, cmd: "insertUnorderedList", title: "Bullet list" },
    { icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered list" },
    { icon: Quote, cmd: "formatBlock", arg: "BLOCKQUOTE", title: "Quote" },
    { divider: true },
    { icon: AlignLeft, cmd: "justifyLeft", title: "Align left" },
    { icon: AlignCenter, cmd: "justifyCenter", title: "Align center" },
    { icon: AlignRight, cmd: "justifyRight", title: "Align right" },
    { divider: true },
    { icon: LinkIcon, action: handleLink, title: "Insert link" },
    { icon: ImageIcon, action: handleImage, title: "Insert image" },
    {
      icon: Minus,
      cmd: "insertHorizontalRule",
      title: "Horizontal rule",
    },
    {
      icon: Code,
      cmd: "formatBlock",
      arg: "PRE",
      title: "Code block",
    },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
        {tools.map((tool, i) => {
          if (tool.divider)
            return <div key={i} className="w-px h-5 bg-gray-300 mx-1" />;
          const Icon = tool.icon;
          return (
            <button
              key={i}
              type="button"
              title={tool.title}
              onMouseDown={(e) => e.preventDefault()}
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
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="min-h-[280px] max-h-[600px] overflow-y-auto p-4 text-sm text-text focus:outline-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
          [&_p]:my-2
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-light [&_blockquote]:my-3
          [&_a]:text-primary [&_a]:underline
          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
          [&_hr]:my-4 [&_hr]:border-gray-300
          [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:text-xs [&_pre]:overflow-x-auto
        "
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEmailEditor;
