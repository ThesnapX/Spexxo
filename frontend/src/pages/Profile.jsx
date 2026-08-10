import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  UserIcon,
  MapPinIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
  HeartIcon as HeartOutlineIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const addressIcons = [
  { id: "home", icon: HomeIcon, label: "Home" },
  { id: "work", icon: BriefcaseIcon, label: "Work" },
  { id: "other", icon: MapPinIcon, label: "Other" },
];

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Address management
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
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

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [editProfile, setEditProfile] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  // Load user data and addresses
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      if (user.addresses) {
        setAddresses(user.addresses);
      }
    }
  }, [user]);

  // Fetch fresh user data
  const refreshUser = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`);
      if (data.user.addresses) {
        setAddresses(data.user.addresses);
      }
    } catch (error) {
      console.log("Failed to refresh user data");
    }
  };

  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (username === user?.username) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/auth/check-username/${username}`,
      );
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API_URL}/auth/update-profile`,
        profileForm,
      );
      updateProfile(data.user);
      toast.success("Profile updated!");
      setEditProfile(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setEditPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // ============ ADDRESS FUNCTIONS ============
  const resetAddressForm = () => {
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
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      name: addr.name || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      area: addr.area || "",
      city: addr.city || "",
      state: addr.state || "Maharashtra",
      pincode: addr.pincode || "",
      isDefault: addr.isDefault || false,
    });
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
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
    setSaving(true);
    try {
      if (editingAddressId) {
        await axios.put(
          `${API_URL}/users/address/${editingAddressId}`,
          addressForm,
        );
        toast.success("Address updated!");
      } else {
        await axios.post(`${API_URL}/users/address`, addressForm);
        toast.success("Address added!");
      }
      await refreshUser();
      resetAddressForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`${API_URL}/users/address/${addressId}`);
      toast.success("Address deleted!");
      await refreshUser();
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await axios.put(`${API_URL}/users/address/${addressId}`, {
        isDefault: true,
      });
      toast.success("Default address updated!");
      await refreshUser();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "password", label: "Password", icon: LockClosedIcon },
    { id: "addresses", label: "Addresses", icon: MapPinIcon },
  ];

  return (
    <>
      <SEO title="My Account" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-bold text-text mb-8">
            My Account
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-text-light truncate">
                      @{user?.username || user?.email?.split("@")[0]}
                    </p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-[#EBF4FC] text-primary" : "text-text-light hover:bg-gray-50 hover:text-text"}`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </nav>
                <div className="border-t mt-4 pt-4 space-y-1">
                  <Link
                    to="/account/orders"
                    className="block px-3 py-2.5 rounded-lg text-sm text-text-light hover:bg-gray-50 transition"
                  >
                    📦 My Orders
                  </Link>
                  <Link
                    to="/account/wishlist"
                    className="block px-3 py-2.5 rounded-lg text-sm text-text-light hover:bg-gray-50 transition"
                  >
                    ❤️ Wishlist
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text">
                      Profile Information
                    </h2>
                    {!editProfile && (
                      <button
                        onClick={() => setEditProfile(true)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" /> Edit
                      </button>
                    )}
                  </div>
                  {!editProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "First Name", value: user?.firstName || "-" },
                        { label: "Last Name", value: user?.lastName || "-" },
                        {
                          label: "Username",
                          value: user?.username
                            ? `@${user.username}`
                            : "Not set",
                        },
                        { label: "Email", value: user?.email || "-" },
                        {
                          label: "Phone",
                          value: user?.phone || "Not provided",
                        },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-xs text-text-light mb-1">
                            {item.label}
                          </p>
                          <p className="font-medium text-text">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.firstName}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                firstName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.lastName}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                lastName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Username
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            @
                          </div>
                          <input
                            type="text"
                            value={profileForm.username}
                            onChange={(e) => {
                              const val = e.target.value.replace(
                                /[^a-zA-Z0-9_]/g,
                                "",
                              );
                              setProfileForm({ ...profileForm, username: val });
                              checkUsername(val);
                            }}
                            className="w-full pl-8 pr-10 py-2.5 border border-gray-200 rounded-lg"
                            placeholder="your_username"
                          />
                          {checkingUsername && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                          )}
                          {usernameAvailable === true && (
                            <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                          )}
                          {usernameAvailable === false && (
                            <XCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                          )}
                        </div>
                        {usernameAvailable === false && (
                          <p className="text-xs text-red-500 mt-1">
                            Username already taken
                          </p>
                        )}
                        {usernameAvailable === true && (
                          <p className="text-xs text-green-500 mt-1">
                            Username available!
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={saving || usernameAvailable === false}
                          className="btn-primary text-sm"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditProfile(false)}
                          className="btn-outline text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text">
                      Change Password
                    </h2>
                    {!editPassword && (
                      <button
                        onClick={() => setEditPassword(true)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" /> Change
                      </button>
                    )}
                  </div>
                  {!editPassword ? (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-text-light">
                        Password: ••••••••••
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSavePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-text-light mt-1">
                          Minimum 6 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary text-sm"
                        >
                          {saving ? "Updating..." : "Update Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPassword(false);
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                          className="btn-outline text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text">
                      My Addresses
                    </h2>
                    <button
                      onClick={() => {
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" /> Add Address
                    </button>
                  </div>

                  {/* Address Form Popup */}
                  {showAddressForm && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">
                          {editingAddressId
                            ? "Edit Address"
                            : "Add New Address"}
                        </h3>
                        <button onClick={resetAddressForm}>
                          <XMarkIcon className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      <form onSubmit={handleSaveAddress} className="space-y-4">
                        {/* Address Type */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Address Type
                          </label>
                          <div className="flex gap-3">
                            {addressIcons.map((type) => (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() =>
                                  setAddressForm({
                                    ...addressForm,
                                    name: type.label,
                                  })
                                }
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition ${addressForm.name === type.label ? "border-primary bg-[#EBF4FC] text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                              >
                                <type.icon className="w-4 h-4" /> {type.label}
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
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                                setAddressForm({
                                  ...addressForm,
                                  area: e.target.value,
                                })
                              }
                              placeholder="Locality"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                                setAddressForm({
                                  ...addressForm,
                                  city: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
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
                          <span className="text-sm">
                            Set as default address
                          </span>
                        </label>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary text-sm"
                          >
                            {saving
                              ? "Saving..."
                              : editingAddressId
                                ? "Update Address"
                                : "Save Address"}
                          </button>
                          <button
                            type="button"
                            onClick={resetAddressForm}
                            className="btn-outline text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Address List */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                      <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-text-light">No saved addresses</p>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="text-primary text-sm hover:underline mt-2"
                      >
                        Add your first address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className={`bg-white rounded-xl border-2 p-5 relative ${addr.isDefault ? "border-primary" : "border-gray-100"}`}
                        >
                          {addr.isDefault && (
                            <span className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            {addr.name === "Home" ? (
                              <HomeIcon className="w-5 h-5 text-gray-500" />
                            ) : addr.name === "Work" ? (
                              <BriefcaseIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                              <MapPinIcon className="w-5 h-5 text-gray-500" />
                            )}
                            <span className="font-semibold text-text">
                              {addr.name}
                            </span>
                          </div>
                          <p className="font-medium text-text">
                            {addr.fullName}
                          </p>
                          <p className="text-sm text-text-light">
                            {addr.addressLine1}
                          </p>
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
                          <p className="text-sm text-text-light">
                            📞 {addr.phone}
                          </p>
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <PencilIcon className="w-3 h-3" /> Edit
                            </button>
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefault(addr._id)}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(addr._id)}
                              className="text-xs text-red-500 hover:underline ml-auto flex items-center gap-1"
                            >
                              <TrashIcon className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
