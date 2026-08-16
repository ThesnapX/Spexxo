import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  UserIcon,
  ShoppingBagIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  PencilIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  HomeIcon,
  BriefcaseIcon,
  KeyIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const UserDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("meta");
  const [showOrderModal, setShowOrderModal] = useState(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [sendingResetLink, setSendingResetLink] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    role: "customer",
    isActive: true,
  });

  const [addressForm, setAddressForm] = useState({
    name: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    area: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    isDefault: false,
  });

  // Fetch user
  const {
    data: userData,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users/${id}`);
      return data.user || null;
    },
    enabled: !!id,
  });

  // Fetch user orders
  const { data: ordersData } = useQuery({
    queryKey: ["admin-user-orders", id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/orders/admin/all?limit=100`,
        );
        return data.orders?.filter((order) => order.user?._id === id) || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Fetch user reviews
  const { data: allReviewsData } = useQuery({
    queryKey: ["admin-all-reviews-for-user"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/reviews/all`);
        return data.reviews || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      const { data } = await axios.put(`${API_URL}/users/${id}`, userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated successfully!");
      setIsEditing(false);
      refetchUser();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update user");
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ addressId, addressData }) => {
      const { data } = await axios.put(
        `${API_URL}/users/address/${addressId}`,
        addressData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      toast.success("Address updated successfully!");
      setEditingAddress(null);
      setShowAddressForm(false);
      refetchUser();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update address");
    },
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData) => {
      const { data } = await axios.post(
        `${API_URL}/users/address`,
        addressData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      toast.success("Address added successfully!");
      setShowAddressForm(false);
      refetchUser();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add address");
    },
  });

  // Send reset password link mutation
  const sendResetLinkMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: user?.email,
      });
      return data;
    },
    onSuccess: () => {
      toast.success(`Password reset link sent to ${user?.email}`);
      setSendingResetLink(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send reset link");
      setSendingResetLink(false);
    },
  });

  const user = userData;
  const orders = ordersData || [];
  const allReviews = allReviewsData || [];
  const reviews = allReviews.filter((review) => review.user?._id === id);

  const tabs = [
    { id: "meta", label: "User Meta", icon: ClipboardDocumentListIcon },
    { id: "addresses", label: "Addresses", icon: MapPinIcon },
    { id: "orders", label: "Order History", icon: ShoppingBagIcon },
    { id: "reviews", label: "Reviews", icon: StarIcon },
  ];

  // Initialize edit form when user data loads
  useState(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "customer",
        isActive: user.isActive !== false,
      });
    }
  }, [user]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-light">Loading user...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold">User Not Found</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="btn-primary mt-4 text-sm"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const handleViewOrder = (order) => {
    setShowOrderModal(order);
  };

  const closeOrderModal = () => {
    setShowOrderModal(null);
  };

  const handleViewProduct = (productId) => {
    if (productId) {
      navigate(`/admin/products/view/${productId}`);
    }
  };

  const handleViewOrderDetail = (orderId) => {
    if (orderId) {
      navigate(`/admin/orders/${orderId}`);
    }
  };

  const handleEditUser = () => {
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "customer",
      isActive: user.isActive !== false,
    });
    setIsEditing(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    updateUserMutation.mutate(editForm);
  };

  const handleSendResetLink = () => {
    if (window.confirm(`Send password reset link to ${user?.email}?`)) {
      setSendingResetLink(true);
      sendResetLinkMutation.mutate();
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm({
      name: address.name || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      area: address.area || "",
      city: address.city || "",
      state: address.state || "Maharashtra",
      pincode: address.pincode || "",
      isDefault: address.isDefault || false,
    });
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleAddAddress = () => {
    setAddressForm({
      name: "Home",
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      landmark: "",
      area: "",
      city: "",
      state: "Maharashtra",
      pincode: "",
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (
      !addressForm.fullName ||
      !addressForm.addressLine1 ||
      !addressForm.city ||
      !addressForm.pincode
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({
        addressId: editingAddress._id,
        addressData: addressForm,
      });
    } else {
      addAddressMutation.mutate(addressForm);
    }
  };

  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  // Address type icons
  const addressIcons = {
    Home: HomeIcon,
    Work: BriefcaseIcon,
    Other: MapPinIcon,
  };

  const AddressIcon = ({ name }) => {
    const Icon = addressIcons[name] || MapPinIcon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div>
      {/* Back Button */}

      {/* User Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-text-light">
                <span>
                  Customer ID: <strong>{user.customerId || "N/A"}</strong>
                </span>
                <span>•</span>
                <span>
                  Username: <strong>@{user.username || "Not set"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive !== false
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.isActive !== false ? "Active" : "Inactive"}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                  {user.role || "Customer"}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleEditUser}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <PencilIcon className="w-4 h-4" /> Edit User
            </button>
            <button
              onClick={handleSendResetLink}
              disabled={sendingResetLink}
              className="btn-outline text-sm flex items-center gap-1"
            >
              <KeyIcon className="w-4 h-4" />
              {sendingResetLink ? "Sending..." : "Send Reset Link"}
            </button>
            <Link
              to={`/account`}
              target="_blank"
              className="btn-outline text-sm"
            >
              View as Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Username (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="btn-primary text-sm flex-1"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-primary border-t border-l border-r border-gray-100"
                : "text-text-light hover:text-text"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === "orders" && orders.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {orders.length}
              </span>
            )}
            {tab.id === "reviews" && reviews.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {reviews.length}
              </span>
            )}
            {tab.id === "addresses" && user.addresses?.length > 0 && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {user.addresses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* META TAB */}
      {activeTab === "meta" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Full Name</p>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Email</p>
              <p className="font-medium flex items-center gap-2">
                {user.email}
                {user.isEmailVerified ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-xs text-text-light">
                    (Not verified)
                  </span>
                )}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Username</p>
              <p className="font-medium">@{user.username || "Not set"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Role</p>
              <p className="font-medium capitalize">
                {user.role || "Customer"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-text-light">Status</p>
              <p
                className={`font-medium ${user.isActive !== false ? "text-green-600" : "text-red-600"}`}
              >
                {user.isActive !== false ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl col-span-2">
              <p className="text-xs text-text-light">Account Created</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADDRESSES TAB - NEW */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">
              Saved Addresses ({user.addresses?.length || 0})
            </h2>
            <button
              onClick={handleAddAddress}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" /> Add Address
            </button>
          </div>

          {/* Add/Edit Address Form */}
          {showAddressForm && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h3>
                <button onClick={handleCancelAddress}>
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address Type
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {["Home", "Work", "Other"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setAddressForm({ ...addressForm, name: type })
                        }
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition ${
                          addressForm.name === type
                            ? "border-primary bg-[#EBF4FC] text-primary"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <AddressIcon name={type} /> {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        addressLine1: e.target.value,
                      })
                    }
                    placeholder="House/Flat No., Building, Street"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        addressLine2: e.target.value,
                      })
                    }
                    placeholder="Colony, Apartment Name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={addressForm.landmark}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          landmark: e.target.value,
                        })
                      }
                      placeholder="Nearby landmark"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Area / Locality
                    </label>
                    <input
                      type="text"
                      value={addressForm.area}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, area: e.target.value })
                      }
                      placeholder="Locality"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          pincode: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        isDefault: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm">Set as default address</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={
                      updateAddressMutation.isPending ||
                      addAddressMutation.isPending
                    }
                    className="btn-primary text-sm flex-1"
                  >
                    {updateAddressMutation.isPending ||
                    addAddressMutation.isPending
                      ? "Saving..."
                      : editingAddress
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAddress}
                    className="btn-outline text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address List */}
          {user.addresses?.length === 0 && !showAddressForm ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-light">No saved addresses</p>
              <button
                onClick={handleAddAddress}
                className="text-primary text-sm hover:underline mt-2"
              >
                Add first address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.addresses?.map((addr) => (
                <div
                  key={addr._id}
                  className={`bg-white rounded-xl border-2 p-5 relative ${
                    addr.isDefault ? "border-primary" : "border-gray-100"
                  }`}
                >
                  {addr.isDefault && (
                    <span className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <AddressIcon name={addr.name} />
                    <span className="font-semibold text-text">{addr.name}</span>
                  </div>
                  <p className="font-medium text-text">{addr.fullName}</p>
                  <p className="text-sm text-text-light">{addr.addressLine1}</p>
                  {addr.addressLine2 && (
                    <p className="text-sm text-text-light">
                      {addr.addressLine2}
                    </p>
                  )}
                  <p className="text-sm text-text-light">
                    {addr.landmark && `${addr.landmark}, `}
                    {addr.area && `${addr.area}, `}
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-sm text-text-light">📞 {addr.phone}</p>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleEditAddress(addr)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <PencilIcon className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Order History ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-text-light text-center py-12">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => handleViewOrder(order)}
                  className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition cursor-pointer border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrderDetail(order._id);
                        }}
                        className="font-medium text-sm hover:text-primary hover:underline transition"
                      >
                        Order #{order.orderNumber}
                      </button>
                      <p className="text-xs text-text-light">
                        {new Date(order.createdAt).toLocaleDateString()} •{" "}
                        {order.items?.length || 0} items
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.orderStatus === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.orderStatus === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : order.orderStatus === "shipped"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.orderStatus?.toUpperCase() || "PENDING"}
                        </span>
                        <span className="text-xs text-text-light">
                          {order.paymentMethod === "online"
                            ? "💳 Online"
                            : "💵 COD"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text">
                        ₹{order.total?.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-light">
                        {order.paymentStatus === "paid"
                          ? "✅ Paid"
                          : "⏳ Pending"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProduct(item.product?._id);
                        }}
                        className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border text-xs flex-shrink-0 hover:border-primary hover:bg-primary/5 transition"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-6 h-6 rounded object-cover"
                          />
                        ) : (
                          <PhotoIcon className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="truncate max-w-24">{item.name}</span>
                        <span className="text-text-light">
                          ×{item.quantity}
                        </span>
                      </button>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="text-xs text-text-light flex items-center">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === "reviews" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Reviews by {user.firstName} ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-light">No reviews yet by this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <button
                        onClick={() => handleViewProduct(review.product?._id)}
                        className="font-medium text-sm hover:text-primary hover:underline transition"
                      >
                        {review.product?.name || "Product"}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) =>
                            i < review.rating ? (
                              <StarSolid
                                key={i}
                                className="w-3.5 h-3.5 text-yellow-400"
                              />
                            ) : (
                              <StarIcon
                                key={i}
                                className="w-3.5 h-3.5 text-gray-300"
                              />
                            ),
                          )}
                        </div>
                        <span className="text-xs text-text-light">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.isHidden ? (
                          <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
                            Hidden
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Visible
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewProduct(review.product?._id)}
                      className="text-xs text-primary hover:underline"
                    >
                      View Product →
                    </button>
                  </div>
                  {review.title && (
                    <p className="font-medium text-sm mt-2">{review.title}</p>
                  )}
                  <p className="text-sm text-text-light mt-1">
                    {review.comment}
                  </p>
                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          alt="Review"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  )}
                  {review.adminReply && (
                    <div className="mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700">
                        Admin Reply
                      </p>
                      <p className="text-sm text-text mt-1">
                        {review.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeOrderModal}
          />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <button
              onClick={closeOrderModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-text mb-2">
              Order #{showOrderModal.orderNumber}
            </h2>
            <p className="text-sm text-text-light mb-4">
              Placed on {new Date(showOrderModal.createdAt).toLocaleString()}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Status</p>
                <p className="font-medium capitalize">
                  {showOrderModal.orderStatus}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-text-light">Payment</p>
                <p className="font-medium">
                  {showOrderModal.paymentMethod?.toUpperCase()}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                <p className="text-xs text-text-light">Total</p>
                <p className="font-bold text-lg">
                  ₹{showOrderModal.total?.toLocaleString()}
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-sm mb-2">Items</h3>
            <div className="space-y-2">
              {showOrderModal.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <PhotoIcon className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-text-light">
                      ×{item.quantity} @ ₹{item.price}
                    </p>
                  </div>
                  <p className="text-sm font-medium">₹{item.subtotal}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleViewOrderDetail(showOrderModal._id)}
              className="btn-primary text-sm w-full mt-4"
            >
              View Full Order Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailView;
