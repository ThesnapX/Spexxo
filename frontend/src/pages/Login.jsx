import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Login = () => {
  const [authMethod, setAuthMethod] = useState("phone");
  const [loginMethod, setLoginMethod] = useState("password");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", phone: "" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Load saved credentials on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("savedCredentials");
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        if (parsed.rememberMe && parsed.identifier) {
          setAuthMethod(parsed.authMethod || "email");
          if (parsed.authMethod === "phone") {
            setForm((prev) => ({ ...prev, phone: parsed.identifier }));
          } else {
            setForm((prev) => ({ ...prev, email: parsed.identifier }));
          }
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Failed to load saved credentials");
      }
    }
  }, []);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const payload = { type: "login" };
      let response;
      if (authMethod === "phone") {
        if (!form.phone || form.phone.length < 10) {
          toast.error("Enter valid phone number");
          setLoading(false);
          return;
        }
        payload.phone = form.phone;
        response = await axios.post(`${API_URL}/otp/send-phone`, payload);
      } else {
        if (!form.email) {
          toast.error("Enter email");
          setLoading(false);
          return;
        }
        payload.email = form.email;
        response = await axios.post(`${API_URL}/otp/send-email`, payload);
      }
      setStep(2);
      toast.success("OTP sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const identifier = authMethod === "phone" ? form.phone : form.email;
      if (!identifier) {
        toast.error(
          authMethod === "phone" ? "Enter phone number" : "Enter email",
        );
        setLoading(false);
        return;
      }
      if (!form.password) {
        toast.error("Enter password");
        setLoading(false);
        return;
      }

      await login(identifier, form.password);

      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem(
          "savedCredentials",
          JSON.stringify({
            identifier: identifier,
            authMethod: authMethod,
            rememberMe: true,
          }),
        );
      } else {
        localStorage.removeItem("savedCredentials");
      }

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

          {/* Phone/Email Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setAuthMethod("phone");
                setStep(1);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${authMethod === "phone" ? "bg-[#EBF4FC] text-[#3D96EB]" : "bg-gray-100 text-gray-500"}`}
            >
              <PhoneIcon className="w-4 h-4" /> Phone
            </button>
            <button
              onClick={() => {
                setAuthMethod("email");
                setStep(1);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${authMethod === "email" ? "bg-[#EBF4FC] text-[#3D96EB]" : "bg-gray-100 text-gray-500"}`}
            >
              <EnvelopeIcon className="w-4 h-4" /> Email
            </button>
          </div>

          {/* Password/OTP Tabs */}
          {step === 1 && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setLoginMethod("password")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${loginMethod === "password" ? "bg-primary text-white" : "bg-gray-100"}`}
              >
                Password
              </button>
              <button
                onClick={() => setLoginMethod("otp")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${loginMethod === "otp" ? "bg-primary text-white" : "bg-gray-100"}`}
              >
                OTP
              </button>
            </div>
          )}

          {step === 1 && (
            <form
              onSubmit={handlePasswordLogin}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4"
              autoComplete="on"
            >
              {authMethod === "phone" ? (
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
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        if (v.length <= 10) setForm({ ...form, phone: v });
                      }}
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="Enter email"
                  />
                </div>
              )}

              {loginMethod === "password" && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              )}

              {loginMethod === "password" ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm text-text-light">
                        Remember Me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3"
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              )}

              <div className="text-center text-sm text-text-light pt-2">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Create Account
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
