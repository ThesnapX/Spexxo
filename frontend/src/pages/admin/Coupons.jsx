import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Coupons = () => {
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    discountOn: "total",
    minPurchase: "0",
    maxDiscount: "",
    totalUsageLimit: "",
    perUserLimit: "1",
    startDate: "",
    endDate: "",
  });
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons-manage"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/coupons`);
      return data.coupons;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_URL}/coupons`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons-manage"] });
      toast.success("Coupon created!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axios.put(`${API_URL}/coupons/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons-manage"] });
      toast.success("Coupon updated!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons-manage"] });
      toast.success("Coupon deleted!");
    },
  });

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      discountOn: "total",
      minPurchase: "0",
      maxDiscount: "",
      totalUsageLimit: "",
      perUserLimit: "1",
      startDate: "",
      endDate: "",
    });
    setEditCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || "",
      discountOn: coupon.discountOn || "total",
      minPurchase: coupon.minPurchase || "0",
      maxDiscount: coupon.maxDiscount || "",
      totalUsageLimit: coupon.totalUsageLimit || "",
      perUserLimit: coupon.perUserLimit || "1",
      startDate: coupon.startDate?.split("T")[0] || "",
      endDate: coupon.endDate?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      discountOn: form.discountOn,
      minPurchase: Number(form.minPurchase),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      totalUsageLimit: form.totalUsageLimit
        ? Number(form.totalUsageLimit)
        : undefined,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    if (editCoupon) {
      updateMutation.mutate({ id: editCoupon._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Coupons</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-primary text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Coupon
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {editCoupon ? "Edit Coupon" : "Add Coupon"}
            </h2>
            <button onClick={resetForm}>
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg uppercase"
                placeholder="e.g. SUMMER50"
                required
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder={
                  form.discountType === "percentage" ? "e.g. 10" : "e.g. 500"
                }
                required
                min="0"
              />
            </div>

            {/* Apply Discount On */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Apply Discount On *
              </label>
              <select
                value={form.discountOn}
                onChange={(e) =>
                  setForm({ ...form, discountOn: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
              >
                <option value="total">Total Order Amount</option>
                <option value="product">Product Price Only</option>
                <option value="delivery">Delivery Charges Only</option>
              </select>
              <p className="text-xs text-text-light mt-1">
                {form.discountOn === "total" &&
                  "Discount applies to full order total"}
                {form.discountOn === "product" &&
                  "Discount only on product price (excluding delivery)"}
                {form.discountOn === "delivery" &&
                  "Discount only on delivery/shipping charges"}
              </p>
            </div>

            {/* Min Purchase */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Purchase (₹)
              </label>
              <input
                type="number"
                value={form.minPurchase}
                onChange={(e) =>
                  setForm({ ...form, minPurchase: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-text-light mt-1">
                Minimum cart amount required
              </p>
            </div>

            {/* Max Discount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Discount (₹)
              </label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscount: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="No limit"
                min="0"
              />
              <p className="text-xs text-text-light mt-1">
                Cap on discount amount (for % coupons)
              </p>
            </div>

            {/* Total Usage Limit */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Usage Limit
              </label>
              <input
                type="number"
                value={form.totalUsageLimit}
                onChange={(e) =>
                  setForm({ ...form, totalUsageLimit: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="Unlimited"
                min="1"
              />
              <p className="text-xs text-text-light mt-1">
                How many times this coupon can be used <strong>overall</strong>{" "}
                (empty = unlimited)
              </p>
            </div>

            {/* Per User Limit */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Per User Limit
              </label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) =>
                  setForm({ ...form, perUserLimit: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="1"
                min="1"
              />
              <p className="text-xs text-text-light mt-1">
                How many times <strong>one user</strong> can use this coupon
                (default: 1)
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="e.g. Summer sale - 50% off on all sunglasses"
              />
            </div>

            {/* Buttons */}
            <div className="md:col-span-3 flex gap-3 pt-2">
              <button type="submit" className="btn-primary text-sm">
                {editCoupon ? "Update Coupon" : "Create Coupon"}
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

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Code
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Discount
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Applies To
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Min Purchase
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Period
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Used
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Per User
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Status
                </th>
                <th className="text-right p-4 text-sm font-medium text-text-light">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : !coupons || coupons.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center">
                    <p className="text-text-light">No coupons created yet</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-primary text-sm hover:underline mt-2"
                    >
                      Create your first coupon
                    </button>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const now = new Date();
                  const isExpired = new Date(coupon.endDate) < now;
                  const isNotStarted = new Date(coupon.startDate) > now;
                  const isMaxedOut =
                    coupon.totalUsageLimit &&
                    coupon.usedCount >= coupon.totalUsageLimit;

                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Code */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-primary text-sm">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <p className="text-xs text-text-light truncate max-w-[150px]">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="p-4 text-sm">
                        <span className="font-medium">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : `₹${coupon.discountValue}`}
                        </span>
                        {coupon.maxDiscount &&
                          coupon.discountType === "percentage" && (
                            <p className="text-xs text-text-light">
                              Max: ₹{coupon.maxDiscount}
                            </p>
                          )}
                      </td>

                      {/* Applies To */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            coupon.discountOn === "total"
                              ? "bg-blue-100 text-blue-700"
                              : coupon.discountOn === "product"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {coupon.discountOn === "total"
                            ? "Total"
                            : coupon.discountOn === "product"
                              ? "Product"
                              : "Delivery"}
                        </span>
                      </td>

                      {/* Min Purchase */}
                      <td className="p-4 text-sm">
                        {coupon.minPurchase > 0
                          ? `₹${coupon.minPurchase}`
                          : "None"}
                      </td>

                      {/* Period */}
                      <td className="p-4 text-xs text-text-light">
                        <p>
                          {new Date(coupon.startDate).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                        <p>to</p>
                        <p>
                          {new Date(coupon.endDate).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                      </td>

                      {/* Total Used */}
                      <td className="p-4">
                        <span
                          className={`text-sm font-medium ${
                            isMaxedOut ? "text-red-600" : "text-text"
                          }`}
                        >
                          {coupon.usedCount || 0}
                          <span className="text-text-light">
                            /{coupon.totalUsageLimit || "∞"}
                          </span>
                        </span>
                      </td>

                      {/* Per User */}
                      <td className="p-4 text-sm">
                        {coupon.perUserLimit || 1}x
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isExpired ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                            Expired
                          </span>
                        ) : isNotStarted ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                            Upcoming
                          </span>
                        ) : isMaxedOut ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            Maxed Out
                          </span>
                        ) : coupon.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete coupon "${coupon.code}"?`,
                                )
                              )
                                deleteMutation.mutate(coupon._id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Coupons;
