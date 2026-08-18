// frontend/src/components/common/AddressForm.jsx

import { useState, useEffect, useRef } from "react";
import {
  getAddressFromPincode,
  validateAddress,
} from "../../utils/pincodeService";
import {
  HomeIcon,
  BriefcaseIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const addressIcons = [
  { id: "home", icon: HomeIcon, label: "Home" },
  { id: "work", icon: BriefcaseIcon, label: "Work" },
  { id: "other", icon: MapPinIcon, label: "Other" },
];

const AddressForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  showTypeSelector = true,
  showSaveToProfile = false,
  className = "",
}) => {
  const [formData, setFormData] = useState({
    name: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState({});
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeFetched, setPincodeFetched] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [touchedFields, setTouchedFields] = useState({});
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);
  const [originalCity, setOriginalCity] = useState("");
  const [originalState, setOriginalState] = useState("");

  const pincodeTimeoutRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || "Home",
        fullName: initialData.fullName || "",
        phone: initialData.phone || "",
        addressLine1: initialData.addressLine1 || "",
        addressLine2: initialData.addressLine2 || "",
        landmark: initialData.landmark || "",
        area: initialData.area || "",
        city: initialData.city || "",
        state: initialData.state || "",
        pincode: initialData.pincode || "",
        isDefault: initialData.isDefault || false,
      });
      if (initialData.city) setOriginalCity(initialData.city);
      if (initialData.state) setOriginalState(initialData.state);
    }
  }, [initialData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pincodeTimeoutRef.current) {
        clearTimeout(pincodeTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setTouchedFields({ ...touchedFields, [field]: true });

    // Clear field-specific error
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }

    // If pincode is being changed, reset fetched status
    if (field === "pincode") {
      setPincodeFetched(false);
      setPincodeError("");
      setIsManuallyEditing(false);

      // Clear any existing timeout
      if (pincodeTimeoutRef.current) {
        clearTimeout(pincodeTimeoutRef.current);
      }

      // Auto-fetch when pincode reaches 6 digits
      if (value.length === 6) {
        // Use a ref to prevent multiple simultaneous fetches
        if (!isFetchingRef.current) {
          pincodeTimeoutRef.current = setTimeout(() => {
            // Get the latest pincode value from formData
            const currentPincode = value;
            if (currentPincode.length === 6) {
              handlePincodeFetch(currentPincode);
            }
          }, 500);
        }
      }
    }

    // If user manually edits city or state, mark as manual edit
    if (field === "city" || field === "state") {
      if (pincodeFetched) {
        setIsManuallyEditing(true);
      }
    }
  };

  const handlePincodeFetch = async (pincodeValue = null) => {
    // Use the passed pincode or get it from formData
    const pincode = pincodeValue || formData.pincode;

    if (!pincode || pincode.length !== 6) {
      setPincodeError("Please enter a valid 6-digit pincode");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      setPincodeError("Pincode must contain only digits");
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsFetchingPincode(true);
    setPincodeError("");

    try {
      const result = await getAddressFromPincode(pincode);

      if (result && result.success) {
        const newCity = result.city || "";
        const newState = result.state || "";

        setFormData((prev) => ({
          ...prev,
          city: newCity || prev.city,
          state: newState || prev.state,
          area: result.area || prev.area,
        }));

        setOriginalCity(newCity);
        setOriginalState(newState);
        setPincodeFetched(true);
        setIsManuallyEditing(false);
        toast.success(
          `Location found: ${newCity || "City"}, ${newState || "State"}`,
        );
      } else {
        setPincodeError(
          result?.message || "Invalid pincode. Please check and try again.",
        );
        setPincodeFetched(false);
      }
    } catch (error) {
      setPincodeError("Failed to fetch location. Please enter manually.");
      setPincodeFetched(false);
    } finally {
      setIsFetchingPincode(false);
      isFetchingRef.current = false;
    }
  };

  const handlePincodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (pincodeTimeoutRef.current) {
        clearTimeout(pincodeTimeoutRef.current);
      }
      handlePincodeFetch();
    }
  };

  const handleBlur = (field) => {
    setTouchedFields({ ...touchedFields, [field]: true });
  };

  const handleManualEditToggle = () => {
    setIsManuallyEditing(true);
    toast.info("You can now edit city and state manually");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the form
    const validationErrors = validateAddress(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    const allFields = Object.keys(formData);
    const touched = {};
    allFields.forEach((field) => {
      touched[field] = true;
    });
    setTouchedFields(touched);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    onSubmit(formData);
  };

  const getInputClass = (field) => {
    const hasError = errors[field] && touchedFields[field];
    return `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 transition ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
        : "border-gray-200 focus:border-[#3D96EB] focus:ring-[#3D96EB]/20"
    }`;
  };

  const getError = (field) => {
    if (errors[field] && touchedFields[field]) {
      return errors[field];
    }
    return null;
  };

  // Check if city/state should be readonly (auto-fetched and not manually editing)
  const isCityStateReadonly = pincodeFetched && !isManuallyEditing;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Address Type Selector */}
      {showTypeSelector && (
        <div>
          <label className="block text-sm font-medium mb-2 text-text">
            Address Type
          </label>
          <div className="flex gap-3 flex-wrap">
            {addressIcons.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleChange("name", type.label)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition ${
                  formData.name === type.label
                    ? "border-primary bg-[#EBF4FC] text-primary"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-text"
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium mb-1 text-text">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          onBlur={() => handleBlur("fullName")}
          className={getInputClass("fullName")}
          placeholder="Enter full name"
          required
        />
        {getError("fullName") && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            {getError("fullName")}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1 text-text">
          Phone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            +91
          </span>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (v.length <= 10) handleChange("phone", v);
            }}
            onBlur={() => handleBlur("phone")}
            className={`${getInputClass("phone")} pl-12`}
            placeholder="10-digit number"
            maxLength={10}
            required
          />
        </div>
        {getError("phone") && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            {getError("phone")}
          </p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-text">
          Address Line 1 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.addressLine1}
          onChange={(e) => handleChange("addressLine1", e.target.value)}
          onBlur={() => handleBlur("addressLine1")}
          className={getInputClass("addressLine1")}
          placeholder="House/Flat No., Building, Street"
          required
        />
        {getError("addressLine1") && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            {getError("addressLine1")}
          </p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-text">
          Address Line 2{" "}
          <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.addressLine2}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          placeholder="Colony, Apartment Name"
        />
      </div>

      {/* Landmark and Area - Side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            Landmark <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.landmark}
            onChange={(e) => handleChange("landmark", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            placeholder="Nearby landmark"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            Area / Locality
          </label>
          <input
            type="text"
            value={formData.area}
            onChange={(e) => handleChange("area", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            placeholder="Locality"
          />
        </div>
      </div>

      {/* Pincode with auto-fetch */}
      <div>
        <label className="block text-sm font-medium mb-1 text-text">
          Pincode <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                if (v.length <= 6) {
                  handleChange("pincode", v);
                }
              }}
              onBlur={() => {
                handleBlur("pincode");
                // Also trigger fetch on blur if pincode is 6 digits and not fetched
                if (
                  formData.pincode.length === 6 &&
                  !pincodeFetched &&
                  !isFetchingRef.current
                ) {
                  handlePincodeFetch();
                }
              }}
              onKeyDown={handlePincodeKeyDown}
              className={`${getInputClass("pincode")} pr-10`}
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              required
            />
            {pincodeFetched && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            {isFetchingPincode && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (pincodeTimeoutRef.current) {
                clearTimeout(pincodeTimeoutRef.current);
              }
              handlePincodeFetch();
            }}
            disabled={isFetchingPincode || formData.pincode.length !== 6}
            className="px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            {isFetchingPincode ? "Fetching..." : "Fetch"}
          </button>
        </div>
        {getError("pincode") && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            {getError("pincode")}
          </p>
        )}
        {pincodeError && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <ExclamationCircleIcon className="w-3 h-3" />
            {pincodeError}
          </p>
        )}
        {pincodeFetched && !pincodeError && (
          <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            Location fetched successfully!
          </p>
        )}
        <p className="text-xs text-text-light mt-1">
          Enter 6-digit pincode to auto-fetch city and state
        </p>
      </div>

      {/* City and State - Auto-filled from pincode */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
              readOnly={isCityStateReadonly}
              className={`${getInputClass("city")} ${
                pincodeFetched
                  ? isManuallyEditing
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-green-50"
                  : ""
              } ${isCityStateReadonly ? "cursor-not-allowed opacity-90" : ""}`}
              placeholder="Enter city"
              required
            />
            {pincodeFetched && !isManuallyEditing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <button
                  type="button"
                  onClick={handleManualEditToggle}
                  className="text-xs text-primary hover:underline ml-1 flex items-center gap-0.5"
                  title="Edit manually"
                >
                  <PencilIcon className="w-3 h-3" />
                </button>
              </div>
            )}
            {pincodeFetched && isManuallyEditing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-yellow-600">(Manual)</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsManuallyEditing(false);
                    setFormData((prev) => ({
                      ...prev,
                      city: originalCity || prev.city,
                      state: originalState || prev.state,
                    }));
                    toast.info("Reverted to fetched location");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Revert
                </button>
              </div>
            )}
          </div>
          {getError("city") && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <ExclamationCircleIcon className="w-3 h-3" />
              {getError("city")}
            </p>
          )}
          {pincodeFetched && !isManuallyEditing && (
            <p className="text-green-500 text-xs mt-1">
              Auto-filled from pincode
            </p>
          )}
          {pincodeFetched && isManuallyEditing && (
            <p className="text-yellow-600 text-xs mt-1">Manually edited</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            State <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              onBlur={() => handleBlur("state")}
              readOnly={isCityStateReadonly}
              className={`${getInputClass("state")} ${
                pincodeFetched
                  ? isManuallyEditing
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-green-50"
                  : ""
              } ${isCityStateReadonly ? "cursor-not-allowed opacity-90" : ""}`}
              placeholder="Enter state"
              required
            />
            {pincodeFetched && !isManuallyEditing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
          {getError("state") && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <ExclamationCircleIcon className="w-3 h-3" />
              {getError("state")}
            </p>
          )}
          {pincodeFetched && !isManuallyEditing && (
            <p className="text-green-500 text-xs mt-1">
              Auto-filled from pincode
            </p>
          )}
          {pincodeFetched && isManuallyEditing && (
            <p className="text-yellow-600 text-xs mt-1">Manually edited</p>
          )}
        </div>
      </div>

      {/* Set as Default */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isDefault}
          onChange={(e) => handleChange("isDefault", e.target.checked)}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <span className="text-sm text-text">Set as default address</span>
      </label>

      {/* Save to Profile (for checkout) */}
      {showSaveToProfile && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.saveToProfile || false}
            onChange={(e) => handleChange("saveToProfile", e.target.checked)}
            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
          />
          <span className="text-sm text-text-light">
            Save this address for future orders
          </span>
        </label>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || isFetchingPincode}
          className="btn-primary text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Saving..."
            : isEditing
              ? "Update Address"
              : "Save Address"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default AddressForm;
