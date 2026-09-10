// frontend/src/components/admin/BulkUploadModal.jsx

import { useState } from "react";
import {
  X,
  Upload,
  FileDown,
  AlertCircle,
  CheckCircle,
  FileText,
  FolderTree,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if it's a CSV file
      const isCsv =
        selectedFile.type === "text/csv" ||
        selectedFile.type === "text/plain" ||
        selectedFile.name.endsWith(".csv");

      if (!isCsv) {
        toast.error("Please upload a CSV file");
        e.target.value = ""; // Reset input
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/shipping/template?format=csv`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "shipping-pincode-template.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded!");
    } catch (error) {
      toast.error("Failed to download template");
      console.error("Template download error:", error);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/shipping/bulk-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          },
        },
      );

      if (response.data.success) {
        setResult(response.data);
        toast.success(response.data.message);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);

      let errorMessage = "Upload failed";
      if (error.response) {
        errorMessage =
          error.response.data?.message || error.response.statusText;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
        errors: [],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-text">
              Bulk Upload Pincodes
            </h2>
            <p className="text-sm text-text-light mt-1">
              Upload a CSV file to add multiple pincode rules at once
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* CSV Format Info with Folder & Sub-Folder */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  CSV Format Requirements
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
                  <li>
                    <strong>folder</strong> - Main folder/State (e.g.,
                    Maharashtra, Karnataka)
                  </li>
                  <li>
                    <strong>subFolder</strong> - Sub-folder/City/Zone (e.g.,
                    Mumbai Region, Pune Region) - Optional
                  </li>
                  <li>
                    <strong>name</strong> - Descriptive name for this rule
                  </li>
                  <li>
                    <strong>type</strong> - "single" or "range"
                  </li>
                  <li>
                    <strong>pincode</strong> - For single type (6 digits)
                  </li>
                  <li>
                    <strong>pincodeFrom / pincodeTo</strong> - For range type (6
                    digits each)
                  </li>
                  <li>
                    <strong>shippingPrice</strong> - Shipping cost (₹)
                  </li>
                  <li>
                    <strong>estimatedDelivery</strong> - Delivery time (e.g.,
                    "3-5 business days")
                  </li>
                  <li>
                    <strong>isActive</strong> - "true" or "false"
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FolderTree className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-text">
                    Need a template?
                  </p>
                  <p className="text-xs text-text-light">
                    Download the CSV template with "folder" and "subFolder"
                    columns
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* Upload Area */}
          {!result ? (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Upload CSV File
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  file
                    ? "border-primary bg-[#EBF4FC]"
                    : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-primary mb-2" />
                      <p className="font-medium text-text">{file.name}</p>
                      <p className="text-sm text-text-light">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-sm text-red-500 hover:underline mt-2"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="font-medium text-text">
                        Click to upload CSV
                      </p>
                      <p className="text-sm text-text-light">
                        or drag and drop
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-text-light mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full mt-4 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload & Import"}
              </button>
            </div>
          ) : (
            // Result Display
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  result.successCount > 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.successCount > 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {result.successCount > 0
                        ? "Upload Complete!"
                        : "Upload Failed"}
                    </p>
                    <p className="text-sm text-text-light">
                      {result.successCount} records processed,{" "}
                      {result.failedCount} failed
                    </p>
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="font-medium text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Errors ({result.errors.length})
                  </p>
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-red-600 bg-white p-2 rounded border border-red-100"
                      >
                        <span className="font-medium">Row {err.row}:</span>{" "}
                        {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.fileUrl && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-text-light">
                  <span className="font-medium">File URL:</span>{" "}
                  <a
                    href={result.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View uploaded file
                  </a>
                </div>
              )}

              <button onClick={handleClose} className="w-full btn-primary py-3">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
