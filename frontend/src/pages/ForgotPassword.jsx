import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Forgot Password" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-md">
          <h1 className="text-3xl font-bold text-text text-center mb-8">
            Forgot Password
          </h1>

          {sent ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
              <p className="text-6xl mb-4">📧</p>
              <h2 className="text-xl font-semibold text-text mb-2">
                Check Your Email
              </h2>
              <p className="text-text-light mb-6">
                We've sent a password reset link to {email}
              </p>
              <Link to="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white p-8 rounded-2xl border border-gray-100 space-y-4"
            >
              <p className="text-text-light text-sm">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
