// frontend/src/components/admin/ProductTypeSelector.jsx

import { useState } from "react";
import { CubeIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

const ProductTypeSelector = ({ value, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text mb-2">
        Product Type <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <button
          type="button"
          onClick={() => onChange("simple")}
          className={`p-4 rounded-xl border-2 transition text-center ${
            value === "simple"
              ? "border-primary bg-[#EBF4FC] text-primary"
              : "border-gray-200 hover:border-gray-300 text-text"
          }`}
        >
          <CubeIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Simple Product</p>
          <p className="text-xs text-text-light mt-1">
            One variant with single price & stock
          </p>
        </button>
        <button
          type="button"
          onClick={() => onChange("variable")}
          className={`p-4 rounded-xl border-2 transition text-center ${
            value === "variable"
              ? "border-primary bg-[#EBF4FC] text-primary"
              : "border-gray-200 hover:border-gray-300 text-text"
          }`}
        >
          <Squares2X2Icon className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Variable Product</p>
          <p className="text-xs text-text-light mt-1">
            Multiple variants with different prices & stocks
          </p>
        </button>
      </div>
    </div>
  );
};

export default ProductTypeSelector;
