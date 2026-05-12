import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Popups = () => {
  const [showForm, setShowForm] = useState(false);
  const [editPopup, setEditPopup] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewPopup, setPreviewPopup] = useState(null);

  const [form, setForm] = useState({
    name: "",
    title: "",
    content: "",
    buttonText: "",
    buttonLink: "",
    triggerType: "onload",
    triggerDelay: "0",
    frequency: "once-per-session",
    pages: "",
    excludePages: "",
    position: "center",
    overlay: true,
    isActive: true,
    startDate: "",
    endDate: "",
  });

  const queryClient = useQueryClient();

  const { data: popups, isLoading } = useQuery({
    queryKey: ["popups-manage"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/popups`);
      return data.popups || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_URL}/popups`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups-manage"] });
      toast.success("Popup created!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create popup");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axios.put(`${API_URL}/popups/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups-manage"] });
      toast.success("Popup updated!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update popup");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/popups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups-manage"] });
      toast.success("Popup deleted!");
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      title: "",
      content: "",
      buttonText: "",
      buttonLink: "",
      triggerType: "onload",
      triggerDelay: "0",
      frequency: "once-per-session",
      pages: "",
      excludePages: "",
      position: "center",
      overlay: true,
      isActive: true,
      startDate: "",
      endDate: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditPopup(null);
    setShowForm(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (popup) => {
    setEditPopup(popup);
    setForm({
      name: popup.name || "",
      title: popup.title || "",
      content: popup.content || "",
      buttonText: popup.buttonText || "",
      buttonLink: popup.buttonLink || "",
      triggerType: popup.triggerType || "onload",
      triggerDelay: popup.triggerDelay || "0",
      frequency: popup.frequency || "once-per-session",
      pages: popup.pages?.join(", ") || "",
      excludePages: popup.excludePages?.join(", ") || "",
      position: popup.position || "center",
      overlay: popup.overlay !== false,
      isActive: popup.isActive !== false,
      startDate: popup.startDate?.split("T")[0] || "",
      endDate: popup.endDate?.split("T")[0] || "",
    });
    setImagePreview(popup.image?.url || null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageData = editPopup?.image || null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        const { data } = await axios.post(`${API_URL}/upload/single`, formData);
        imageData = { url: data.image.url, alt: form.title || form.name };
      } catch (error) {
        toast.error("Image upload failed");
        setUploading(false);
        return;
      }
    }

    const payload = {
      ...form,
      triggerDelay: Number(form.triggerDelay),
      overlay: form.overlay,
      isActive: form.isActive,
      image: imageData,
      pages: form.pages
        ? form.pages
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
      excludePages: form.excludePages
        ? form.excludePages
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
    };

    if (editPopup) {
      updateMutation.mutate({ id: editPopup._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setUploading(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this popup?")) {
      deleteMutation.mutate(id);
    }
  };

  const triggerLabels = {
    onload: "On Page Load",
    scroll: "On Scroll",
    "exit-intent": "Exit Intent",
    "time-delay": "Time Delay",
    click: "On Click",
  };

  const frequencyLabels = {
    "every-visit": "Every Visit",
    "once-per-session": "Once Per Session",
    "once-per-day": "Once Per Day",
    "once-per-week": "Once Per Week",
    "once-only": "Once Only",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Popup Management</h1>
          <p className="text-sm text-text-light mt-1">
            Create promotional popups for your store
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Popup
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {editPopup ? "Edit Popup" : "Create New Popup"}
            </h2>
            <button onClick={resetForm}>
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Popup Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Popup Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. Summer Sale Popup"
                required
              />
              <p className="text-xs text-text-light mt-1">
                Internal name for reference
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. 🎉 Big Sale!"
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                rows="3"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. Get 50% off on all sunglasses. Limited time offer!"
              />
            </div>

            {/* Popup Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Popup Image
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-40 h-28 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#3D96EB] hover:bg-[#EBF4FC] transition">
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                {imagePreview && (
                  <label className="cursor-pointer text-sm text-[#3D96EB] hover:underline">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Button Text */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) =>
                  setForm({ ...form, buttonText: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. Shop Now"
              />
            </div>

            {/* Button Link */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Button Link
              </label>
              <input
                type="text"
                value={form.buttonLink}
                onChange={(e) =>
                  setForm({ ...form, buttonLink: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. /shop/sunglasses"
              />
            </div>

            {/* Trigger Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Trigger Type
              </label>
              <select
                value={form.triggerType}
                onChange={(e) =>
                  setForm({ ...form, triggerType: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              >
                <option value="onload">On Page Load</option>
                <option value="scroll">On Scroll</option>
                <option value="exit-intent">Exit Intent</option>
                <option value="time-delay">Time Delay</option>
                <option value="click">On Click</option>
              </select>
            </div>

            {/* Trigger Delay */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Trigger Delay (seconds)
              </label>
              <input
                type="number"
                value={form.triggerDelay}
                onChange={(e) =>
                  setForm({ ...form, triggerDelay: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                min="0"
              />
              <p className="text-xs text-text-light mt-1">
                {form.triggerType === "time-delay"
                  ? "Show after X seconds"
                  : form.triggerType === "scroll"
                    ? "Show after scrolling X%"
                    : "Delay before showing"}
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              >
                <option value="every-visit">Every Visit</option>
                <option value="once-per-session">Once Per Session</option>
                <option value="once-per-day">Once Per Day</option>
                <option value="once-per-week">Once Per Week</option>
                <option value="once-only">Once Only (Never Again)</option>
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              >
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            {/* Pages to Show */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Show on Pages
              </label>
              <input
                type="text"
                value={form.pages}
                onChange={(e) => setForm({ ...form, pages: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. /, /shop, /shop/sunglasses"
              />
              <p className="text-xs text-text-light mt-1">
                Leave empty to show on all pages. Separate with commas.
              </p>
            </div>

            {/* Exclude Pages */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Exclude Pages
              </label>
              <input
                type="text"
                value={form.excludePages}
                onChange={(e) =>
                  setForm({ ...form, excludePages: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
                placeholder="e.g. /checkout, /cart"
              />
              <p className="text-xs text-text-light mt-1">
                Pages where popup should NOT appear
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB]"
              />
            </div>

            {/* Options */}
            <div className="md:col-span-2 flex flex-wrap gap-6 p-4 bg-gray-50 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.overlay}
                  onChange={(e) =>
                    setForm({ ...form, overlay: e.target.checked })
                  }
                  className="w-4 h-4 text-[#3D96EB] rounded"
                />
                <span className="text-sm font-medium">
                  Show Overlay Background
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-[#3D96EB] rounded"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary text-sm"
              >
                {uploading
                  ? "Uploading..."
                  : editPopup
                    ? "Update Popup"
                    : "Create Popup"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-outline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Popups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center p-8">Loading...</div>
        ) : !popups || popups.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-gray-100">
            <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-text mb-1">No Popups Yet</h3>
            <p className="text-text-light text-sm mb-4">
              Create your first promotional popup
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm"
            >
              Create Popup
            </button>
          </div>
        ) : (
          popups.map((popup) => (
            <div
              key={popup._id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              {/* Preview Image */}
              <div className="h-40 bg-gray-50 flex items-center justify-center">
                {popup.image?.url ? (
                  <img
                    src={popup.image.url}
                    alt={popup.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <PhotoIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No image</p>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-text text-sm">
                      {popup.name}
                    </h3>
                    {popup.title && (
                      <p className="text-xs text-text-light">{popup.title}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      popup.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {popup.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-xs text-text-light">
                    <span className="font-medium">Trigger:</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      {triggerLabels[popup.triggerType] || popup.triggerType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-light">
                    <span className="font-medium">Frequency:</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      {frequencyLabels[popup.frequency] || popup.frequency}
                    </span>
                  </div>
                  {popup.pages?.length > 0 && (
                    <p className="text-xs text-text-light truncate">
                      <span className="font-medium">Pages:</span>{" "}
                      {popup.pages.join(", ")}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-1 pt-3 border-t">
                  <button
                    onClick={() => setPreviewPopup(popup)}
                    className="p-2 text-gray-500 hover:text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                    title="Preview"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(popup)}
                    className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(popup._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewPopup(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPopup(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {previewPopup.image?.url && (
              <img
                src={previewPopup.image.url}
                alt={previewPopup.title || previewPopup.name}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            {previewPopup.title && (
              <h2 className="text-2xl font-bold text-text mb-2">
                {previewPopup.title}
              </h2>
            )}

            {previewPopup.content && (
              <p className="text-text-light mb-6">{previewPopup.content}</p>
            )}

            {previewPopup.buttonText && (
              <a
                href={previewPopup.buttonLink || "#"}
                target={
                  previewPopup.buttonLink?.startsWith("http")
                    ? "_blank"
                    : "_self"
                }
                rel="noopener noreferrer"
                className="btn-primary w-full text-center block"
              >
                {previewPopup.buttonText}
              </a>
            )}

            <p className="text-xs text-text-light text-center mt-4">
              Trigger: {triggerLabels[previewPopup.triggerType]} | Frequency:{" "}
              {frequencyLabels[previewPopup.frequency]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popups;
