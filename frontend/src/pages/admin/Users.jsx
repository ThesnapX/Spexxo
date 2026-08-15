import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Users = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users`);
      return data;
    },
  });

  const users = data?.users || [];

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }) => {
      await axios.put(`${API_URL}/users/${id}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated!");
      setEditMode(false);
      setSelectedUser(null);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to update user"),
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id) => {
      await axios.put(`${API_URL}/users/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deactivated!");
      setSelectedUser(null);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to deactivate"),
  });

  const reactivateUserMutation = useMutation({
    mutationFn: async (id) => {
      await axios.put(`${API_URL}/users/${id}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User reactivated!");
      setSelectedUser(null);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to reactivate"),
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "customer",
    });
  };

  const handleEditMode = () => setEditMode(true);

  const handleSaveUser = async () => {
    if (!editForm.email || !editForm.firstName) {
      toast.error("First name and email are required");
      return;
    }
    setSaving(true);
    updateUserMutation.mutate({ id: selectedUser._id, userData: editForm });
    setSaving(false);
  };

  const handleDeactivateUser = () => {
    if (
      window.confirm(
        `Deactivate user "${selectedUser.firstName} ${selectedUser.lastName}"? They will not be able to login.`,
      )
    ) {
      deactivateUserMutation.mutate(selectedUser._id);
    }
  };

  const handleReactivateUser = () => {
    if (
      window.confirm(
        `Reactivate user "${selectedUser.firstName} ${selectedUser.lastName}"?`,
      )
    ) {
      reactivateUserMutation.mutate(selectedUser._id);
    }
  };

  const statusColors = {
    admin: "bg-purple-100 text-purple-700",
    customer: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-sm text-text-light mt-1">
            {users.length} users registered
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  ID
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  User
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Email
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Phone
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Role
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Joined
                </th>
                <th className="text-center p-4 text-sm font-medium text-text-light">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-text-light">
                    No users registered yet
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 ${user.isActive === false ? "opacity-60" : ""}`}
                  >
                    <td className="p-4">
                      <span className="text-xs font-mono font-medium text-primary">
                        {user.customerId || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-text">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.username && (
                            <p className="text-xs text-text-light">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-light">
                      {user.email}
                    </td>
                    <td className="p-4 text-sm text-text-light">
                      {user.phone || "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.role] || "bg-gray-100"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isActive !== false ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-text-light">
                      {new Date(user.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-semibold">
                  {selectedUser.firstName?.[0]}
                  {selectedUser.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-sm text-text-light">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={handleEditMode}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <PencilIcon className="w-4 h-4" /> Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {editMode ? (
                    <>
                      <div>
                        <label className="block text-xs text-text-light mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-light mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-light mb-1">
                          Username
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            @
                          </span>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                username: e.target.value,
                              })
                            }
                            className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-text-light mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-light mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-light mb-1">
                          Role
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Customer ID</p>
                        <p className="font-medium text-sm font-mono text-primary">
                          {selectedUser.customerId || "-"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">First Name</p>
                        <p className="font-medium text-sm">
                          {selectedUser.firstName || "-"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Last Name</p>
                        <p className="font-medium text-sm">
                          {selectedUser.lastName || "-"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Username</p>
                        <p className="font-medium text-sm">
                          {selectedUser.username
                            ? `@${selectedUser.username}`
                            : "Not set"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Email</p>
                        <p className="font-medium text-sm truncate">
                          {selectedUser.email || "-"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Phone</p>
                        <p className="font-medium text-sm">
                          {selectedUser.phone || "-"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Role</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {selectedUser.role}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">Joined</p>
                        <p className="font-medium text-sm">
                          {new Date(selectedUser.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-text-light">
                          Wishlist Items
                        </p>
                        <p className="font-medium text-sm">
                          {selectedUser.wishlist?.length || 0}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm font-medium mb-2">Account Status</p>
                {selectedUser.isActive !== false ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                ) : (
                  <div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Inactive
                    </span>
                    {selectedUser.deactivatedAt && (
                      <p className="text-xs text-text-light mt-1">
                        Deactivated:{" "}
                        {new Date(
                          selectedUser.deactivatedAt,
                        ).toLocaleDateString("en-IN")}
                      </p>
                    )}
                    {selectedUser.deactivationReason && (
                      <p className="text-xs text-text-light mt-1">
                        Reason: {selectedUser.deactivationReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Addresses */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">
                  Addresses ({selectedUser.addresses?.length || 0})
                </h3>
                {selectedUser.addresses?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.addresses.map((addr, i) => (
                      <div
                        key={i}
                        className={`bg-gray-50 p-4 rounded-xl border ${addr.isDefault ? "border-primary/30" : "border-gray-100"}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {addr.name === "Home" ? (
                            <HomeIcon className="w-4 h-4 text-gray-500" />
                          ) : addr.name === "Work" ? (
                            <BriefcaseIcon className="w-4 h-4 text-gray-500" />
                          ) : (
                            <MapPinIcon className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-semibold text-sm">
                            {addr.name || "Address"}
                          </span>
                          {addr.isDefault && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-sm">{addr.fullName}</p>
                        <p className="text-xs text-text-light">
                          {addr.addressLine1}
                        </p>
                        <p className="text-xs text-text-light">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-xs text-text-light">
                          📞 {addr.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-light bg-gray-50 p-4 rounded-lg">
                    No addresses saved
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t flex-wrap">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSaveUser}
                      disabled={saving}
                      className="btn-primary text-sm"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="btn-outline text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditMode}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <PencilIcon className="w-4 h-4" /> Edit User
                    </button>
                    {selectedUser.isActive !== false ? (
                      <button
                        onClick={handleDeactivateUser}
                        className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        🚫 Deactivate User
                      </button>
                    ) : (
                      <button
                        onClick={handleReactivateUser}
                        className="text-green-500 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        ✅ Reactivate User
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
