// frontend/src/components/admin/blog/ResponsivePreview.jsx

import { useState } from "react";
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import BlockRenderer from "../../blog/BlockRenderer";

const SIZES = {
  desktop: {
    width: "100%",
    maxWidth: 1280,
    label: "Desktop",
    icon: ComputerDesktopIcon,
  },
  tablet: { width: 768, label: "Tablet", icon: DeviceTabletIcon },
  mobile: { width: 375, label: "Mobile", icon: DevicePhoneMobileIcon },
};

const ResponsivePreview = ({ blocks, onClose }) => {
  const [device, setDevice] = useState("desktop");
  const size = SIZES[device];

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text mr-3">
            Responsive Preview
          </span>
          {Object.entries(SIZES).map(([key, val]) => {
            const Icon = val.icon;
            const active = device === key;
            return (
              <button
                key={key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-primary text-white"
                    : "text-text-light hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {val.label}
              </button>
            );
          })}
          <span className="text-xs text-text-light ml-3">
            {size.width === "100%" ? "Full width" : `${size.width}px`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-2"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Frame */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div
          className="preview-viewport bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
          style={{
            width: size.width,
            maxWidth: size.maxWidth,
            minHeight: "100%",
          }}
        >
          <div className="p-6 md:p-8">
            {blocks.length === 0 ? (
              <p className="text-center text-text-light py-20">
                No content to preview
              </p>
            ) : (
              <div className="max-w-3xl mx-auto">
                <BlockRenderer blocks={blocks} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsivePreview;
