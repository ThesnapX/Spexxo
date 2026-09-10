// frontend/src/pages/admin/Shipping.jsx

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Truck,
  Zap,
  Settings,
  MapPin,
  Package,
  Upload,
  Folder,
  FolderOpen,
  ChevronRight,
  FolderTree,
  Search,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import BulkUploadModal from "../../components/admin/BulkUploadModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Shipping = () => {
  const [activeTab, setActiveTab] = useState("pincodes");
  const [showPincodeForm, setShowPincodeForm] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // ✅ Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Folder view state
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubFolder, setCurrentSubFolder] = useState(null);
  const [showFolderView, setShowFolderView] = useState(true);
  const [showSubFolderView, setShowSubFolderView] = useState(false);

  const queryClient = useQueryClient();

  // ============ FETCH FOLDERS ============
  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ["shipping-folders"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/shipping/folders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return data.folders || [];
    },
  });

  // ============ FETCH PINCODES (with search) ============
  const {
    data: pincodesData,
    isLoading: pincodesLoading,
    refetch: refetchPincodes,
  } = useQuery({
    queryKey: [
      "shipping-pincodes",
      currentFolder,
      currentSubFolder,
      searchQuery,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFolder) {
        params.set("folder", currentFolder);
      }
      if (currentSubFolder) {
        params.set("subFolder", currentSubFolder);
      }
      if (searchQuery && searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      const { data } = await axios.get(
        `${API_URL}/shipping/pincodes?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return data.rules || [];
    },
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/shipping/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return data.settings || {};
    },
  });

  const pincodes = pincodesData || [];
  const folders = foldersData || [];
  const settings = settingsData || {};

  // ============ MUTATIONS ============
  const createPincodeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_URL}/shipping/pincodes`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-pincodes"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-folders"] });
      toast.success("Pincode rule added!");
      resetPincodeForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to add pincode rule",
      );
    },
  });

  const updatePincodeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(
        `${API_URL}/shipping/pincodes/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-pincodes"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-folders"] });
      toast.success("Pincode rule updated!");
      resetPincodeForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update pincode rule",
      );
    },
  });

  const deletePincodeMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/shipping/pincodes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-pincodes"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-folders"] });
      toast.success("Pincode rule deleted!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete pincode rule",
      );
    },
  });

  // Delete entire folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (folder) => {
      await axios.delete(
        `${API_URL}/shipping/folders/${encodeURIComponent(folder)}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-folders"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-pincodes"] });
      toast.success("Folder deleted successfully!");
      if (currentFolder) {
        setCurrentFolder(null);
        setCurrentSubFolder(null);
        setShowFolderView(true);
        setShowSubFolderView(false);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete folder");
    },
  });

  // Delete entire sub-folder
  const deleteSubFolderMutation = useMutation({
    mutationFn: async ({ folder, subFolder }) => {
      await axios.delete(
        `${API_URL}/shipping/subfolders/${encodeURIComponent(folder)}/${encodeURIComponent(subFolder)}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-folders"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-pincodes"] });
      toast.success("Sub-folder deleted successfully!");
      if (currentSubFolder) {
        setCurrentSubFolder(null);
        setShowSubFolderView(false);
      }
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete sub-folder",
      );
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(`${API_URL}/shipping/settings`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-settings"] });
      toast.success("Settings updated!");
      setShowSettingsForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });

  // ============ PINCODE FORM ============
  const [pincodeForm, setPincodeForm] = useState({
    folder: "",
    subFolder: "",
    type: "single",
    name: "",
    pincode: "",
    pincodeFrom: "",
    pincodeTo: "",
    shippingPrice: "",
    estimatedDelivery: "3-7 business days",
    isActive: true,
  });

  const resetPincodeForm = () => {
    setPincodeForm({
      folder: currentFolder || "",
      subFolder: currentSubFolder || "",
      type: "single",
      name: "",
      pincode: "",
      pincodeFrom: "",
      pincodeTo: "",
      shippingPrice: "",
      estimatedDelivery: "3-7 business days",
      isActive: true,
    });
    setEditingPincode(null);
    setShowPincodeForm(false);
  };

  const handleEditPincode = (rule) => {
    setEditingPincode(rule);
    setPincodeForm({
      folder: rule.folder || "",
      subFolder: rule.subFolder || "",
      type: rule.type || "single",
      name: rule.name || "",
      pincode: rule.pincode || "",
      pincodeFrom: rule.pincodeFrom || "",
      pincodeTo: rule.pincodeTo || "",
      shippingPrice: rule.shippingPrice || "",
      estimatedDelivery: rule.estimatedDelivery || "3-7 business days",
      isActive: rule.isActive !== false,
    });
    setShowPincodeForm(true);
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();

    const data = { ...pincodeForm };

    // Validate folder
    if (!data.folder || !data.folder.trim()) {
      toast.error("Please enter a Folder/State name");
      return;
    }

    // subFolder is optional - set to null if empty
    if (!data.subFolder || !data.subFolder.trim()) {
      data.subFolder = null;
    }

    if (data.type === "single") {
      if (!data.name.trim()) {
        toast.error("Please enter a name for this pincode");
        return;
      }
      if (!/^[0-9]{6}$/.test(data.pincode)) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }
    }

    if (data.type === "range") {
      if (!data.name.trim()) {
        toast.error("Please enter a name for this range");
        return;
      }
      if (
        !/^[0-9]{6}$/.test(data.pincodeFrom) ||
        !/^[0-9]{6}$/.test(data.pincodeTo)
      ) {
        toast.error("Please enter valid 6-digit pincodes");
        return;
      }
      if (parseInt(data.pincodeFrom) > parseInt(data.pincodeTo)) {
        toast.error("From pincode must be less than To pincode");
        return;
      }
    }

    if (!data.shippingPrice || parseFloat(data.shippingPrice) < 0) {
      toast.error("Please enter a valid shipping price");
      return;
    }

    if (editingPincode) {
      updatePincodeMutation.mutate({ id: editingPincode._id, data });
    } else {
      createPincodeMutation.mutate(data);
    }
  };

  // ============ SETTINGS FORM ============
  const [settingsForm, setSettingsForm] = useState({
    ultraFastAdditional: 50,
    ultraFastDelivery: "1-2 business days",
    defaultShippingPrice: 99,
    defaultDelivery: "3-7 business days",
    extraPerQuantity: 25,
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        ultraFastAdditional: settings.ultraFastAdditional || 50,
        ultraFastDelivery: settings.ultraFastDelivery || "1-2 business days",
        defaultShippingPrice: settings.defaultShippingPrice || 99,
        defaultDelivery: settings.defaultDelivery || "3-7 business days",
        extraPerQuantity: settings.extraPerQuantity || 25,
      });
    }
  }, [settings]);

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

  // ✅ Navigate into a folder
  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setCurrentSubFolder(null);
    setShowFolderView(false);
    setShowSubFolderView(true);
    // Clear search when navigating
    setSearchQuery("");
  };

  // ✅ Navigate into a sub-folder
  const handleSubFolderClick = (subFolder) => {
    setCurrentSubFolder(subFolder);
    setShowSubFolderView(false);
  };

  // ✅ Go back to folder view
  const handleBackToFolders = () => {
    setCurrentFolder(null);
    setCurrentSubFolder(null);
    setShowFolderView(true);
    setShowSubFolderView(false);
    setSearchQuery("");
  };

  // ✅ Go back to sub-folder view
  const handleBackToSubFolders = () => {
    setCurrentSubFolder(null);
    setShowSubFolderView(true);
    setSearchQuery("");
  };

  // ✅ Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.value || searchQuery;
    setSearchQuery(query);
    // If searching, show results in current view
    if (query.trim()) {
      setIsSearching(true);
      // Refetch with search query
      refetchPincodes();
    } else {
      setIsSearching(false);
      refetchPincodes();
    }
  };

  // ✅ Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refetchPincodes();
  };

  // ✅ Get folder count
  const getFolderCount = (folderName) => {
    const folder = folders.find((f) => f.folder === folderName);
    return folder ? folder.totalCount : 0;
  };

  // ✅ Get sub-folder count
  const getSubFolderCount = (folderName, subFolderName) => {
    const folder = folders.find((f) => f.folder === folderName);
    if (!folder) return 0;
    const sub = folder.subFolders?.find((sf) => sf.name === subFolderName);
    return sub ? sub.count : 0;
  };

  // ✅ Get sub-folders for a folder
  const getSubFolders = (folderName) => {
    const folder = folders.find((f) => f.folder === folderName);
    return folder ? folder.subFolders || [] : [];
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Shipping Management</h1>
          <p className="text-sm text-text-light mt-1">
            Organize pincodes by folders (State) and sub-folders (City/Zone)
          </p>
        </div>
        {activeTab === "pincodes" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="btn-outline text-sm flex items-center gap-1"
            >
              <Upload className="w-4 h-4" /> Bulk Upload
            </button>
            <button
              onClick={() => {
                resetPincodeForm();
                setShowPincodeForm(true);
              }}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Pincode Rule
            </button>
          </div>
        )}
        {activeTab === "settings" && (
          <button
            onClick={() => setShowSettingsForm(!showSettingsForm)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" />{" "}
            {showSettingsForm ? "Cancel" : "Edit Settings"}
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("pincodes");
            setCurrentFolder(null);
            setCurrentSubFolder(null);
            setShowFolderView(true);
            setShowSubFolderView(false);
            setSearchQuery("");
            setIsSearching(false);
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition ${
            activeTab === "pincodes"
              ? "bg-white text-primary border-t border-l border-r border-gray-100"
              : "text-text-light hover:text-text"
          }`}
        >
          <MapPin className="w-4 h-4" /> Pincode Rules
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition ${
            activeTab === "settings"
              ? "bg-white text-primary border-t border-l border-r border-gray-100"
              : "text-text-light hover:text-text"
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* ==========================================
          PINCODE RULES TAB
          ========================================== */}
      {activeTab === "pincodes" && (
        <>
          {/* ✅ Search Bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by pincode, name, folder, sub-folder... (e.g., 400076, Mumbai, Maharashtra)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!e.target.value.trim()) {
                        setIsSearching(false);
                        refetchPincodes();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch(e);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-xs text-text-light mt-2">
                  Showing results for:{" "}
                  <span className="font-medium text-primary">
                    "{searchQuery}"
                  </span>
                  {pincodes.length === 0 && " - No results found"}
                </p>
              )}
            </form>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-text-light mb-4 flex-wrap">
            <button
              onClick={handleBackToFolders}
              className={`hover:text-primary transition ${
                showFolderView && !currentFolder && !searchQuery
                  ? "text-primary font-medium"
                  : ""
              }`}
            >
              All States
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={handleBackToSubFolders}
                  className={`hover:text-primary transition ${
                    showSubFolderView && !currentSubFolder
                      ? "text-primary font-medium"
                      : ""
                  }`}
                >
                  {currentFolder}
                </button>
                <span className="text-xs text-text-light ml-1">
                  ({getFolderCount(currentFolder)} rules)
                </span>
              </>
            )}
            {currentSubFolder && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-text font-medium">
                  {currentSubFolder}
                </span>
                <span className="text-xs text-text-light ml-1">
                  ({getSubFolderCount(currentFolder, currentSubFolder)} rules)
                </span>
              </>
            )}
            {searchQuery && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-primary font-medium">Search Results</span>
              </>
            )}
          </div>

          {showPincodeForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {editingPincode ? "Edit Pincode Rule" : "Add Pincode Rule"}
                </h2>
                <button
                  onClick={resetPincodeForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePincodeSubmit} className="space-y-4">
                {/* Folder Field */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    State/Folder <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pincodeForm.folder}
                    onChange={(e) =>
                      setPincodeForm({ ...pincodeForm, folder: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g. Maharashtra, Karnataka"
                    list="folder-suggestions"
                    required
                  />
                  <datalist id="folder-suggestions">
                    {folders.map((f) => (
                      <option key={f.folder} value={f.folder} />
                    ))}
                  </datalist>
                  <p className="text-xs text-text-light mt-1">
                    Group pincodes by State or Region
                  </p>
                </div>

                {/* Sub-Folder Field */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    City/Zone (Sub-Folder){" "}
                    <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={pincodeForm.subFolder}
                    onChange={(e) =>
                      setPincodeForm({
                        ...pincodeForm,
                        subFolder: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g. Mumbai Region, Pune Region"
                    list="subfolder-suggestions"
                  />
                  <datalist id="subfolder-suggestions">
                    {getSubFolders(
                      pincodeForm.folder || currentFolder || "",
                    ).map((sf) => (
                      <option key={sf.name} value={sf.name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-text-light mt-1">
                    Optional: Group pincodes by City or Zone within the State
                  </p>
                </div>

                {/* Pincode Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pincode Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPincodeForm({ ...pincodeForm, type: "single" })
                      }
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        pincodeForm.type === "single"
                          ? "border-primary bg-[#EBF4FC] text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      Single Pincode
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPincodeForm({ ...pincodeForm, type: "range" })
                      }
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        pincodeForm.type === "range"
                          ? "border-primary bg-[#EBF4FC] text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      Pincode Range
                    </button>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pincodeForm.name}
                    onChange={(e) =>
                      setPincodeForm({ ...pincodeForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder={
                      pincodeForm.type === "single"
                        ? "e.g. Mumbai Central"
                        : "e.g. Pune Range"
                    }
                    required
                  />
                </div>

                {/* Pincode Inputs */}
                {pincodeForm.type === "single" ? (
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pincodeForm.pincode}
                      onChange={(e) =>
                        setPincodeForm({
                          ...pincodeForm,
                          pincode: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="e.g. 400076"
                      maxLength={6}
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        From Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pincodeForm.pincodeFrom}
                        onChange={(e) =>
                          setPincodeForm({
                            ...pincodeForm,
                            pincodeFrom: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="e.g. 400000"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        To Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pincodeForm.pincodeTo}
                        onChange={(e) =>
                          setPincodeForm({
                            ...pincodeForm,
                            pincodeTo: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="e.g. 400099"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Shipping Price */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium mb-1">
                    Shipping Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={pincodeForm.shippingPrice}
                    onChange={(e) =>
                      setPincodeForm({
                        ...pincodeForm,
                        shippingPrice: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g. 50"
                    min="0"
                    required
                  />
                </div>

                {/* Estimated Delivery */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium mb-1">
                    Estimated Delivery
                  </label>
                  <input
                    type="text"
                    value={pincodeForm.estimatedDelivery}
                    onChange={(e) =>
                      setPincodeForm({
                        ...pincodeForm,
                        estimatedDelivery: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="e.g. 3-7 business days"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pincodeForm.isActive}
                      onChange={(e) =>
                        setPincodeForm({
                          ...pincodeForm,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary text-sm">
                    {editingPincode ? "Update Rule" : "Add Rule"}
                  </button>
                  <button
                    type="button"
                    onClick={resetPincodeForm}
                    className="btn-outline text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==========================================
              FOLDER VIEW (States)
              ========================================== */}
          {showFolderView && !searchQuery ? (
            foldersLoading ? (
              <div className="text-center py-12">Loading folders...</div>
            ) : folders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">
                  No States/Folders Created
                </h3>
                <p className="text-text-light mb-6 text-sm">
                  Add pincode rules with a state/folder name to organize them
                </p>
                <button
                  onClick={() => {
                    resetPincodeForm();
                    setShowPincodeForm(true);
                  }}
                  className="btn-primary text-sm"
                >
                  <Plus className="w-4 h-4" /> Add First Rule
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.folder}
                    onClick={() => handleFolderClick(folder.folder)}
                    className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#EBF4FC] rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition">
                          <FolderOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text group-hover:text-primary transition">
                            {folder.folder}
                          </h3>
                          <p className="text-sm text-text-light">
                            {folder.totalCount} rule
                            {folder.totalCount !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-green-600">
                            {folder.totalActive} active
                          </p>
                          {folder.subFolders?.length > 0 && (
                            <p className="text-xs text-purple-500">
                              {folder.subFolders.length} sub-folders
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Delete entire state "${folder.folder}" and all ${folder.totalCount} rules?`,
                              )
                            ) {
                              deleteFolderMutation.mutate(folder.folder);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {/* ==========================================
              SEARCH RESULTS VIEW
              ========================================== */}
          {searchQuery && (
            <div className="space-y-4">
              {pincodesLoading ? (
                <div className="text-center py-12">Searching...</div>
              ) : pincodes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text mb-2">
                    No Results Found
                  </h3>
                  <p className="text-text-light mb-4 text-sm">
                    No pincode rules match "<strong>{searchQuery}</strong>"
                  </p>
                  <button onClick={clearSearch} className="btn-outline text-sm">
                    Clear Search
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-light mb-4">
                    Found {pincodes.length} result
                    {pincodes.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pincodes.map((rule) => (
                      <div
                        key={rule._id}
                        className={`bg-white rounded-xl border p-5 hover:shadow-md transition ${
                          rule.isActive
                            ? "border-gray-100"
                            : "border-red-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-text">
                              {rule.name || "Unnamed"}
                            </h3>
                            <p className="text-sm text-text-light">
                              {rule.type === "single"
                                ? `Pincode: ${rule.pincode}`
                                : `Range: ${rule.pincodeFrom} - ${rule.pincodeTo}`}
                            </p>
                            <p className="text-xs text-text-light capitalize mt-0.5">
                              {rule.type}
                            </p>
                            {rule.subFolder && (
                              <p className="text-xs text-purple-500 mt-0.5">
                                📁 {rule.subFolder}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              rule.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-text-light">
                          <p>
                            <span className="font-medium">Price:</span>{" "}
                            <span className="text-primary font-semibold">
                              ₹{rule.shippingPrice}
                            </span>
                          </p>
                          <p>Delivery: {rule.estimatedDelivery || "N/A"}</p>
                          <p className="text-xs text-gray-400">
                            {rule.folder}
                            {rule.subFolder && ` / ${rule.subFolder}`}
                          </p>
                        </div>

                        <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                          <button
                            onClick={() => handleEditPincode(rule)}
                            className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete pincode rule "${rule.name || (rule.type === "single" ? rule.pincode : rule.pincodeFrom + "-" + rule.pincodeTo)}"?`,
                                )
                              ) {
                                deletePincodeMutation.mutate(rule._id);
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={clearSearch}
                    className="mt-4 btn-outline text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Clear Search & Go Back
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              SUB-FOLDER VIEW (Cities/Zones)
              ========================================== */}
          {!showFolderView && showSubFolderView && !searchQuery && (
            <>
              {foldersLoading ? (
                <div className="text-center py-12">Loading sub-folders...</div>
              ) : (
                (() => {
                  const subFolders = getSubFolders(currentFolder);
                  return subFolders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                      <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-text mb-2">
                        No Sub-Folders in "{currentFolder}"
                      </h3>
                      <p className="text-text-light mb-6 text-sm">
                        Add pincodes with a sub-folder (City/Zone) to organize
                        further
                      </p>
                      <button
                        onClick={() => {
                          resetPincodeForm();
                          setPincodeForm({
                            ...pincodeForm,
                            folder: currentFolder,
                          });
                          setShowPincodeForm(true);
                        }}
                        className="btn-primary text-sm"
                      >
                        <Plus className="w-4 h-4" /> Add Rule with Sub-Folder
                      </button>
                      <button
                        onClick={() => {
                          setShowSubFolderView(false);
                        }}
                        className="ml-3 btn-outline text-sm"
                      >
                        View All Pincodes
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-text-light">
                          {subFolders.length} sub-folders found
                        </p>
                        <button
                          onClick={() => {
                            setShowSubFolderView(false);
                          }}
                          className="btn-outline text-sm"
                        >
                          View All Pincodes
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subFolders.map((sub) => (
                          <div
                            key={sub.name}
                            onClick={() => handleSubFolderClick(sub.name)}
                            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition">
                                  <FolderTree className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-text group-hover:text-primary transition">
                                    {sub.name}
                                  </h3>
                                  <p className="text-sm text-text-light">
                                    {sub.count} rule
                                    {sub.count !== 1 ? "s" : ""}
                                  </p>
                                  <p className="text-xs text-green-600">
                                    {sub.activeCount} active
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        `Delete sub-folder "${sub.name}" and all ${sub.count} rules?`,
                                      )
                                    ) {
                                      deleteSubFolderMutation.mutate({
                                        folder: currentFolder,
                                        subFolder: sub.name,
                                      });
                                    }
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                  title="Delete Sub-Folder"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </>
          )}

          {/* ==========================================
              PINCODES VIEW (Inside Sub-Folder or All)
              ========================================== */}
          {!showFolderView && !showSubFolderView && !searchQuery && (
            <>
              {pincodesLoading ? (
                <div className="text-center py-12">Loading pincodes...</div>
              ) : pincodes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text mb-2">
                    No Pincodes Found
                  </h3>
                  <p className="text-text-light mb-6 text-sm">
                    {currentSubFolder
                      ? `No pincodes in "${currentFolder} / ${currentSubFolder}"`
                      : `No pincodes in "${currentFolder}"`}
                  </p>
                  <button
                    onClick={() => {
                      resetPincodeForm();
                      setPincodeForm({
                        ...pincodeForm,
                        folder: currentFolder,
                        subFolder: currentSubFolder || "",
                      });
                      setShowPincodeForm(true);
                    }}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Rule
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pincodes.map((rule) => (
                    <div
                      key={rule._id}
                      className={`bg-white rounded-xl border p-5 hover:shadow-md transition ${
                        rule.isActive
                          ? "border-gray-100"
                          : "border-red-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-text">
                            {rule.name || "Unnamed"}
                          </h3>
                          <p className="text-sm text-text-light">
                            {rule.type === "single"
                              ? `Pincode: ${rule.pincode}`
                              : `Range: ${rule.pincodeFrom} - ${rule.pincodeTo}`}
                          </p>
                          <p className="text-xs text-text-light capitalize mt-0.5">
                            {rule.type}
                          </p>
                          {rule.subFolder && (
                            <p className="text-xs text-purple-500 mt-0.5">
                              📁 {rule.subFolder}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            rule.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-text-light">
                        <p>
                          <span className="font-medium">Price:</span>{" "}
                          <span className="text-primary font-semibold">
                            ₹{rule.shippingPrice}
                          </span>
                        </p>
                        <p>Delivery: {rule.estimatedDelivery || "N/A"}</p>
                        <p className="text-xs text-gray-400">
                          {rule.folder}
                          {rule.subFolder && ` / ${rule.subFolder}`}
                        </p>
                      </div>

                      <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                        <button
                          onClick={() => handleEditPincode(rule)}
                          className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete pincode rule "${rule.name || (rule.type === "single" ? rule.pincode : rule.pincodeFrom + "-" + rule.pincodeTo)}"?`,
                              )
                            ) {
                              deletePincodeMutation.mutate(rule._id);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ==========================================
          SETTINGS TAB (unchanged)
          ========================================== */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Shipping Settings
          </h2>

          {settingsLoading ? (
            <div className="text-center py-8">Loading settings...</div>
          ) : (
            <>
              {/* Current Settings Display */}
              {!showSettingsForm && (
                <div className="space-y-6">
                  {/* Ultra Fast Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-text-light">
                        Ultra Fast Additional Price
                      </p>
                      <p className="text-xl font-bold text-primary">
                        ₹{settings.ultraFastAdditional || 50}
                      </p>
                      <p className="text-xs text-text-light mt-1">
                        Added to Basic Shipping price
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-text-light">
                        Ultra Fast Delivery
                      </p>
                      <p className="text-xl font-bold text-text">
                        {settings.ultraFastDelivery || "1-2 business days"}
                      </p>
                    </div>
                  </div>

                  {/* Default Shipping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-text-light">
                        Default Shipping Price
                      </p>
                      <p className="text-xl font-bold text-text">
                        ₹{settings.defaultShippingPrice || 99}
                      </p>
                      <p className="text-xs text-text-light mt-1">
                        Used when no pincode rule matches
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-text-light">
                        Default Delivery
                      </p>
                      <p className="text-xl font-bold text-text">
                        {settings.defaultDelivery || "3-7 business days"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-text-light">
                      Extra Price Per Additional Quantity
                    </p>
                    <p className="text-xl font-bold text-primary">
                      ₹{settings.extraPerQuantity || 25}
                    </p>
                    <p className="text-xs text-text-light mt-1">
                      Added to shipping price for each extra item beyond the
                      first
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      <strong>How shipping calculation works:</strong>
                      <br />
                      1. Customer enters pincode → Check if pincode rule exists
                      <br />
                      2. If matched → Use pincode rule price
                      <br />
                      3. If no match → Use default shipping price
                      <br />
                      4. Extra items: Add ₹{settings.extraPerQuantity || 25} per
                      additional item
                      <br />
                      5. Ultra Fast = Basic Price + Additional Amount
                    </p>
                    <div className="mt-2 text-xs text-blue-600 space-y-1">
                      <p>
                        Example: 1 item → ₹50, 3 items → ₹50 + ₹
                        {settings.extraPerQuantity || 25}×2 = ₹
                        {50 + (settings.extraPerQuantity || 25) * 2}
                      </p>
                      <p>
                        Example: 5 items → ₹50 + ₹
                        {settings.extraPerQuantity || 25}×4 = ₹
                        {50 + (settings.extraPerQuantity || 25) * 4}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Form */}
              {showSettingsForm && (
                <form
                  onSubmit={handleSettingsSubmit}
                  className="space-y-6 max-w-2xl"
                >
                  {/* Ultra Fast Settings */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-text mb-3">
                      Ultra Fast Shipping
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Additional Price (₹)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.ultraFastAdditional}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              ultraFastAdditional: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                          min="0"
                          required
                        />
                        <p className="text-xs text-text-light mt-1">
                          Added to Basic price
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Ultra Fast Delivery
                        </label>
                        <input
                          type="text"
                          value={settingsForm.ultraFastDelivery}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              ultraFastDelivery: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                          placeholder="e.g. 1-2 business days"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Default Shipping */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-text mb-3">
                      Default Shipping (Fallback)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Default Price (₹)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.defaultShippingPrice}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              defaultShippingPrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Default Delivery
                        </label>
                        <input
                          type="text"
                          value={settingsForm.defaultDelivery}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              defaultDelivery: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                          placeholder="e.g. 3-7 business days"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extra Per Quantity */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-text mb-3">
                      Extra Per Quantity
                    </h3>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium mb-1">
                        Extra Price Per Additional Item (₹)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.extraPerQuantity}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            extraPerQuantity: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        min="0"
                        placeholder="e.g. 25"
                      />
                      <p className="text-xs text-text-light mt-1">
                        This amount will be added for each extra item beyond the
                        first item in the order
                      </p>
                      <div className="mt-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700">
                          <strong>Example:</strong> Base price ₹50, Extra ₹25
                          <br />
                          1 item: ₹50
                          <br />
                          3 items: ₹50 + ₹25×2 = ₹100
                          <br />5 items: ₹50 + ₹25×4 = ₹150
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t">
                    <button type="submit" className="btn-primary text-sm">
                      Save All Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSettingsForm(false)}
                      className="btn-outline text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["shipping-pincodes"] });
          queryClient.invalidateQueries({ queryKey: ["shipping-folders"] });
        }}
      />
    </div>
  );
};

export default Shipping;
