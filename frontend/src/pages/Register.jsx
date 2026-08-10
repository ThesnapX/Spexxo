import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/common/SEO";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Register = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    username: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <>
      <SEO title="Register" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-md">
          <h1 className="text-3xl font-bold text-text text-center mb-2">
            Create Account
          </h1>
          <p className="text-text-light text-center mb-8">
            Join Spexxo for the best eyewear deals
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4"
          >
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Username{" "}
                <span className="text-text-light text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  @
                </span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                  placeholder="your_username"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                required
              />
            </div>

            {/* Phone */}
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setForm({ ...form, phone: value });
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric keys
                    if (
                      !/[0-9]/.test(e.key) &&
                      e.key !== "Backspace" &&
                      e.key !== "Delete" &&
                      e.key !== "ArrowLeft" &&
                      e.key !== "ArrowRight" &&
                      e.key !== "Tab"
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-text-light mt-1">
                We'll send order updates to this number
              </p>
            </div>
            {/* Password with Eye Icon */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Login Link */}
            <div className="text-center text-sm text-text-light pt-2">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#3D96EB] font-medium hover:underline"
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
