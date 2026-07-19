import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/common/SEO";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-md">
          <h1 className="text-3xl font-bold text-text text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-text-light text-center mb-8">
            Login to your Spexxo account
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4"
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email or Username
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                placeholder="Enter email or username"
                required
              />
            </div>

            {/* Password with Eye Icon */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3D96EB] focus:ring-1 focus:ring-[#3D96EB]/20 transition"
                  placeholder="Enter password"
                  required
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

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-[#3D96EB] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Register Link */}
            <div className="text-center text-sm text-text-light pt-2">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#3D96EB] font-medium hover:underline"
              >
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
