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
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

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

  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [editProfile, setEditProfile] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [editAddress, setEditAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      if (user.defaultAddress) {
        setAddressForm({
          fullName: user.defaultAddress.fullName || "",
          phone: user.defaultAddress.phone || user.phone || "",
          addressLine1: user.defaultAddress.addressLine1 || "",
          addressLine2: user.defaultAddress.addressLine2 || "",
          landmark: user.defaultAddress.landmark || "",
          area: user.defaultAddress.area || "",
          city: user.defaultAddress.city || "",
          state: user.defaultAddress.state || "",
          pincode: user.defaultAddress.pincode || "",
        });
      }
    }
  }, [user]);

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

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API_URL}/auth/delivery-address`,
        addressForm,
      );
      updateProfile({ ...user, defaultAddress: data.defaultAddress });
      toast.success("Delivery address updated!");
      setEditAddress(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update address");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "password", label: "Password", icon: LockClosedIcon },
    { id: "address", label: "Delivery Address", icon: MapPinIcon },
  ];

  return (
    <>
      <SEO title="My Account" />
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-4xl">
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

              {/* Address Tab */}
              {activeTab === "address" && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text">
                      Delivery Address
                    </h2>
                    {!editAddress && (
                      <button
                        onClick={() => setEditAddress(true)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" /> Edit
                      </button>
                    )}
                  </div>
                  {!editAddress ? (
                    user?.defaultAddress?.addressLine1 ? (
                      <div className="bg-gray-50 p-5 rounded-xl space-y-2">
                        <p className="font-medium text-text text-lg">
                          {user.defaultAddress.fullName}
                        </p>
                        <p className="text-sm text-text">
                          {user.defaultAddress.addressLine1}
                        </p>
                        {user.defaultAddress.addressLine2 && (
                          <p className="text-sm text-text">
                            {user.defaultAddress.addressLine2}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-light">
                          {user.defaultAddress.landmark && (
                            <span>📍 {user.defaultAddress.landmark}</span>
                          )}
                          {user.defaultAddress.area && (
                            <span>🏘️ {user.defaultAddress.area}</span>
                          )}
                        </div>
                        <p className="text-sm text-text-light">
                          {user.defaultAddress.city},{" "}
                          {user.defaultAddress.state} -{" "}
                          {user.defaultAddress.pincode}
                        </p>
                        <p className="text-sm text-text-light">
                          📞 {user.defaultAddress.phone}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <MapPinIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-text-light text-sm">
                          No delivery address set
                        </p>
                        <button
                          onClick={() => setEditAddress(true)}
                          className="text-primary text-sm hover:underline mt-2"
                        >
                          Add Address
                        </button>
                      </div>
                    )
                  ) : (
                    <form onSubmit={handleSaveAddress} className="space-y-4">
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
                            pattern="[0-9]{6}"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary text-sm"
                        >
                          {saving ? "Saving..." : "Save Address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditAddress(false)}
                          className="btn-outline text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
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
