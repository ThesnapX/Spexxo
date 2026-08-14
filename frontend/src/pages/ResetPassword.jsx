import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

  const passwordStrength = getPasswordStrength(password);

  const validateForm = () => {
    const errors = {};
    if (!password) errors.password = "Password is required";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (!confirmPassword) errors.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await axios.put(`${API_URL}/auth/reset-password/${token}`, { password });
      toast.success(
        "Password reset successful! Please login with your new password.",
      );
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reset Password" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-md">
          <h1 className="text-3xl font-bold text-text text-center mb-2">
            Reset Password
          </h1>
          <p className="text-text-light text-center mb-8">
            Enter your new password
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4"
            noValidate
          >
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password)
                      setFormErrors({ ...formErrors, password: undefined });
                  }}
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
              {password && !formErrors.password && (
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
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formErrors.confirmPassword)
                      setFormErrors({
                        ...formErrors,
                        confirmPassword: undefined,
                      });
                  }}
                  className={`w-full px-4 py-2.5 pr-11 border rounded-lg ${formErrors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.confirmPassword}
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 text-xs mt-1">Passwords match ✓</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center text-sm text-text-light">
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
