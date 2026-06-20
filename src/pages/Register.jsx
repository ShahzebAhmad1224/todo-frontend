// pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setLoading(true);
    const result = await register({ name, email, password });
    if (result.success) {
      navigate("/login");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors";
  const labelClass = "block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4 transition-colors duration-200">
      <button onClick={toggleDark}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-yellow-300 hover:shadow-lg transition-all">
        {dark ? "☀️" : "🌙"}
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">WorkNest</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Create your workspace account</p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className={inputClass} required placeholder="John Doe" />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} required placeholder="your@email.com" />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputClass} required placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass} required placeholder="Re-enter password" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-5 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
