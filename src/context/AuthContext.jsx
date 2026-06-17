// context/AuthContext.jsx - Complete working version
import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";

// Create the context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Load user data when token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Set the token in axios headers
          // The interceptor in api.js will handle this automatically
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (error) {
          console.error("Failed to load user:", error);
          // If token is invalid, remove it
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register a new user
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Update user info (if needed)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Value object to be provided to consumers
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    token,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
