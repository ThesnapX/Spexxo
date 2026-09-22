// frontend/src/components/admin/blog/BlockPicker.jsx

import { XMarkIcon } from "@heroicons/react/24/outline";
import { EDITOR_LIBRARY } from "../../../utils/blogBlocks";

const BlockPicker = ({ isOpen, onClose, onPick }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-text">Add Block</h3>
          {/* ✅ type="button" */}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {EDITOR_LIBRARY.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-light mb-2">
                {group.group}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => (
                  // ✅ type="button" — critical
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      onPick(item.type);
                      onClose();
                    }}
                    className="text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-[#EBF4FC] transition"
                  >
                    <span className="text-sm font-medium text-text">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlockPicker;
