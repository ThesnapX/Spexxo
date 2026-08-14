import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const emailTimeout = useRef(null);
  const phoneTimeout = useRef(null);
  const usernameTimeout = useRef(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    username: "",
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (emailTimeout.current) clearTimeout(emailTimeout.current);
      if (phoneTimeout.current) clearTimeout(phoneTimeout.current);
      if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    };
  }, []);

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "", barColor: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2)
      return {
        score: 1,
        label: "Weak",
        color: "text-red-500",
        barColor: "bg-red-500",
      };
    if (score === 3)
      return {
        score: 2,
        label: "Medium",
        color: "text-orange-500",
        barColor: "bg-orange-500",
      };
    return {
      score: 3,
      label: "Strong",
      color: "text-green-500",
      barColor: "bg-green-500",
    };
  };

  const passwordStrength = getPasswordStrength(form.password);

  // Debounced email check
  const checkEmailExists = (email) => {
    if (emailTimeout.current) clearTimeout(emailTimeout.current);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }
    setCheckingEmail(true);
    emailTimeout.current = setTimeout(async () => {
      try {
        await axios.post(`${API_URL}/auth/check-email`, { email });
        setEmailExists(false);
      } catch (error) {
        if (error.response?.status === 400 && error.response.data?.exists) {
          setEmailExists(true);
        } else {
          setEmailExists(false);
        }
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
  };

  // Debounced phone check
  const checkPhoneExists = (phone) => {
    if (phoneTimeout.current) clearTimeout(phoneTimeout.current);
    if (!phone || phone.length !== 10) {
      setPhoneExists(false);
      setCheckingPhone(false);
      return;
    }
    setCheckingPhone(true);
    phoneTimeout.current = setTimeout(async () => {
      try {
        await axios.post(`${API_URL}/auth/check-phone`, { phone });
        setPhoneExists(false);
      } catch (error) {
        if (error.response?.status === 400 && error.response.data?.exists) {
          setPhoneExists(true);
        } else {
          setPhoneExists(false);
        }
      } finally {
        setCheckingPhone(false);
      }
    }, 500);
  };

  // Debounced username check
  const checkUsernameAvailable = (username) => {
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    usernameTimeout.current = setTimeout(async () => {
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
    }, 500);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.lastName.trim()) errors.lastName = "Last name is required";
    if (!form.email) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      errors.email = "Enter a valid email address";
    if (!form.phone) errors.phone = "Phone number is required";
    else if (form.phone.length !== 10)
      errors.phone = "Phone must be exactly 10 digits";
    else if (!/^\d{10}$/.test(form.phone))
      errors.phone = "Phone can only contain digits";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) errors.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (form.username) {
      if (form.username.length < 3)
        errors.username = "Username must be at least 3 characters";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
        errors.username = "Only letters, numbers, and underscores allowed";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (emailExists) return;
    if (phoneExists) return;
    if (form.username && usernameAvailable === false) return;
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: undefined });
    if (field === "email") checkEmailExists(value);
    if (field === "phone") checkPhoneExists(value);
    if (field === "username") checkUsernameAvailable(value);
  };

  // Tooltip Component
  const Tooltip = ({ text, children }) => {
    return (
      <span className="group relative inline-flex">
        {children}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {text}
        </span>
      </span>
    );
  };

  return (
    <>
      <SEO title="Register" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-md">
          <h1 className="text-3xl font-bold text-text text-center mb-2">
            Create Account
          </h1>
          <p className="text-text-light text-center mb-8">
            Join Spexxo for the best eyewear
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4"
            noValidate
          >
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg ${formErrors.firstName ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  placeholder="John"
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg ${formErrors.lastName ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  placeholder="Doe"
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username with tooltip */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Username{" "}
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  @
                </span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                    handleChange("username", v);
                  }}
                  className={`w-full pl-8 pr-10 py-2.5 border rounded-lg ${formErrors.username || usernameAvailable === false ? "border-red-300 bg-red-50" : usernameAvailable === true ? "border-green-300" : "border-gray-200"}`}
                  placeholder="your_username"
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <Tooltip text="Username is available">
                    <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 cursor-help" />
                  </Tooltip>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <Tooltip text="Username is already taken">
                    <XCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 cursor-help" />
                  </Tooltip>
                )}
              </div>
              {formErrors.username && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.username}
                </p>
              )}
              {!formErrors.username && usernameAvailable === false && (
                <p className="text-red-500 text-xs mt-1">
                  Username already taken
                </p>
              )}
              {!formErrors.username && usernameAvailable === true && (
                <p className="text-green-500 text-xs mt-1">
                  Username available!
                </p>
              )}
            </div>

            {/* Email with tooltip */}
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg ${formErrors.email || emailExists ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  placeholder="john@example.com"
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                )}
                {!checkingEmail &&
                  form.email &&
                  !emailExists &&
                  !formErrors.email &&
                  /^\S+@\S+\.\S+$/.test(form.email) && (
                    <Tooltip text="Email format is valid">
                      <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 cursor-help" />
                    </Tooltip>
                  )}
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
              {!formErrors.email && emailExists && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <XCircleIcon className="w-3 h-3" /> This email is already
                  registered.{" "}
                  <Link to="/login" className="underline font-medium">
                    Login instead?
                  </Link>
                </p>
              )}
            </div>

            {/* Phone with tooltip */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v.length <= 10) handleChange("phone", v);
                  }}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete" &&
                      e.key !== "ArrowLeft" &&
                      e.key !== "ArrowRight" &&
                      e.key !== "Tab"
                    )
                      e.preventDefault();
                  }}
                  className={`w-full pl-12 pr-10 py-2.5 border rounded-lg ${formErrors.phone || phoneExists ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                />
                {checkingPhone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                )}
                {!checkingPhone &&
                  form.phone.length === 10 &&
                  !phoneExists &&
                  !formErrors.phone && (
                    <Tooltip text="Phone number is valid">
                      <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 cursor-help" />
                    </Tooltip>
                  )}
              </div>
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
              {!formErrors.phone && phoneExists && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <XCircleIcon className="w-3 h-3" /> This phone is already
                  registered.{" "}
                  <Link to="/login" className="underline font-medium">
                    Login instead?
                  </Link>
                </p>
              )}
              {!formErrors.phone &&
                !phoneExists &&
                form.phone.length === 10 && (
                  <p className="text-green-500 text-xs mt-1">
                    Phone number is valid ✓
                  </p>
                )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`w-full px-4 py-2.5 pr-11 border rounded-lg ${formErrors.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.password}
                </p>
              )}
              {form.password && !formErrors.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1">
                      <div
                        className={`h-1.5 w-12 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.barColor : "bg-gray-200"}`}
                      ></div>
                      <div
                        className={`h-1.5 w-12 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.barColor : "bg-gray-200"}`}
                      ></div>
                      <div
                        className={`h-1.5 w-12 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.barColor : "bg-gray-200"}`}
                      ></div>
                    </div>
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-light flex items-center gap-1">
                    <InformationCircleIcon className="w-3 h-3" /> Use 6+
                    characters with numbers & special characters
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                className={`w-full px-4 py-2.5 border rounded-lg ${formErrors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                placeholder="Re-enter password"
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.confirmPassword}
                </p>
              )}
              {form.confirmPassword &&
                form.password === form.confirmPassword && (
                  <p className="text-green-500 text-xs mt-1">
                    Passwords match ✓
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center text-sm text-text-light">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
