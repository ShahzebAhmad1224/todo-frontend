// pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Dark mode toggle */}
      <button onClick={toggleDark}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-yellow-300 hover:shadow-lg transition-all">
        {dark ? "☀️" : "🌙"}
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">WorkNest</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to your workspace</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              required
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
