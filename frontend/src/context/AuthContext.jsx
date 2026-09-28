// frontend/src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  setAdvancedMatchingIdentity,
  clearAdvancedMatchingIdentity,
} from "../utils/metaPixel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        clearAdvancedMatchingIdentity();
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/auth/me`);
        setUser(data.user);
        // ✅ Feed the identity into Meta Advanced Matching.
        setAdvancedMatchingIdentity(data.user);
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        clearAdvancedMatchingIdentity();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      // ✅ Update Advanced Matching with the freshly logged-in user.
      setAdvancedMatchingIdentity(data.user);
      toast.success("Logged in successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, userData);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      // ✅ New user registers → immediately identify for Meta matching.
      setAdvancedMatchingIdentity(data.user);
      toast.success("Account created successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("savedCredentials");
    setToken(null);
    setUser(null);
    // ✅ Clear Meta Advanced Matching on logout.
    clearAdvancedMatchingIdentity();
    toast.success("Logged out successfully");
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put(
        `${API_URL}/auth/update-profile`,
        profileData,
      );
      setUser(data.user);
      // Refresh identity in case email/phone changed.
      setAdvancedMatchingIdentity(data.user);
      toast.success("Profile updated successfully!");
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
      throw error;
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
