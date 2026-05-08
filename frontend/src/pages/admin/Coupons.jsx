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
    minPurchase: "0",
    maxDiscount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
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
      minPurchase: "0",
      maxDiscount: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
    });
    setEditCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase || "0",
      maxDiscount: coupon.maxDiscount || "",
      startDate: coupon.startDate?.split("T")[0] || "",
      endDate: coupon.endDate?.split("T")[0] || "",
      usageLimit: coupon.usageLimit || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      discountValue: Number(form.discountValue),
      minPurchase: Number(form.minPurchase),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
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
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Coupon
        </button>
      </div>

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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                required
              />
            </div>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({ ...form, usageLimit: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                required
              />
            </div>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary text-sm">
                {editCoupon ? "Update" : "Create"}
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                Period
              </th>
              <th className="text-left p-4 text-sm font-medium text-text-light">
                Used
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
                <td colSpan="6" className="p-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : coupons?.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-text-light">
                  No coupons. Add your first coupon!
                </td>
              </tr>
            ) : (
              coupons?.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <span className="font-mono font-bold text-primary">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue}`}
                  </td>
                  <td className="p-4 text-xs text-text-light">
                    {new Date(coupon.startDate).toLocaleDateString()} -{" "}
                    {new Date(coupon.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm">
                    {coupon.usedCount || 0}/{coupon.usageLimit || "∞"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete?"))
                            deleteMutation.mutate(coupon._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Coupons;
