// frontend/src/components/admin/blog/ImportFromWord.jsx

import { useState, useRef } from "react";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { docxToBlocks } from "../../../utils/docxImporter";
import { htmlToBlocks } from "../../../utils/htmlToBlocks";

const ImportFromWord = ({ isOpen, onClose, onImport }) => {
  const [tab, setTab] = useState("paste"); // "paste" | "upload"
  const [pastedHtml, setPastedHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  // ---------- Handle file upload (.docx) ----------
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Please upload a .docx file (not .doc or .pdf)");
      return;
    }

    setLoading(true);
    try {
      const blocks = await docxToBlocks(file);
      if (blocks.length === 0) {
        toast.error("No content found in the document");
        setLoading(false);
        return;
      }
      onImport(blocks);
      toast.success(`Imported ${blocks.length} blocks from Word!`);
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to read Word file: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Handle paste ----------
  const handlePasteZone = (e) => {
    e.preventDefault();
    // Grab the HTML version of the paste (works for Word, Google Docs, Notion, etc.)
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (!html && !text) {
      toast.error("Nothing to paste");
      return;
    }
    setPastedHtml(
      html || `<p>${escapeHtml(text).replace(/\n\n/g, "</p><p>")}</p>`,
    );
  };

  const handleConvertPasted = () => {
    if (!pastedHtml.trim()) {
      toast.error("Paste some content first");
      return;
    }
    setLoading(true);
    try {
      const blocks = htmlToBlocks(pastedHtml);
      if (blocks.length === 0) {
        toast.error("No content could be parsed");
        setLoading(false);
        return;
      }
      onImport(blocks);
      toast.success(`Imported ${blocks.length} blocks!`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert content");
    } finally {
      setLoading(false);
    }
  };

  const escapeHtml = (text) =>
    text.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-xl font-bold text-text">
              Import from Word / Docs
            </h2>
            <p className="text-sm text-text-light mt-0.5">
              Paste content or upload a .docx file — it becomes editable blocks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5 pt-4 gap-1">
          <button
            onClick={() => setTab("paste")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition ${
              tab === "paste"
                ? "bg-white text-primary border border-b-0 border-gray-200"
                : "text-text-light hover:text-text"
            }`}
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            Paste from anywhere
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 transition ${
              tab === "upload"
                ? "bg-white text-primary border border-b-0 border-gray-200"
                : "text-text-light hover:text-text"
            }`}
          >
            <DocumentArrowUpIcon className="w-4 h-4" />
            Upload .docx
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "paste" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                💡 Open your blog in Word, Google Docs, or Notion, select all,
                copy it, then click the box below and press{" "}
                <kbd className="px-1 py-0.5 bg-white rounded border">
                  Ctrl+V
                </kbd>{" "}
                (or{" "}
                <kbd className="px-1 py-0.5 bg-white rounded border">⌘V</kbd>
                ).
              </div>

              <div
                onPaste={handlePasteZone}
                tabIndex={0}
                className="border-2 border-dashed border-gray-300 rounded-xl min-h-[200px] p-4 focus:outline-none focus:border-primary focus:bg-[#EBF4FC] transition cursor-text"
              >
                {pastedHtml ? (
                  <div>
                    <p className="text-xs text-green-600 mb-2 font-medium">
                      ✓ Content captured ({pastedHtml.length} chars) — ready to
                      import
                    </p>
                    <div
                      className="prose prose-sm max-w-none max-h-48 overflow-y-auto text-text-light border-t pt-2"
                      dangerouslySetInnerHTML={{ __html: pastedHtml }}
                    />
                    <button
                      type="button"
                      onClick={() => setPastedHtml("")}
                      className="text-xs text-red-500 hover:underline mt-2"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardDocumentIcon className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-text">
                      Click here, then paste
                    </p>
                    <p className="text-xs text-text-light mt-1">
                      Supports Word, Google Docs, Notion, and most editors
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConvertPasted}
                  disabled={!pastedHtml || loading}
                  className="btn-primary text-sm flex-1 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin inline mr-1" />
                      Converting...
                    </>
                  ) : (
                    "Import as Blocks"
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tab === "upload" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                💡 Upload a <strong>.docx</strong> file (not .doc or .pdf).
                Images will be extracted automatically.
              </div>

              <label className="border-2 border-dashed border-gray-300 rounded-xl min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-[#EBF4FC] transition p-6">
                <DocumentTextIcon className="w-14 h-14 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-text">
                  Click to upload .docx
                </p>
                <p className="text-xs text-text-light mt-1">
                  Max 10MB · Images inside will be uploaded to Cloudinary
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-text-light">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Reading and converting...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportFromWord;
