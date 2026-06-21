// components/Navbar.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/dashboard", label: "Tasks" },
    { to: "/whiteboard", label: "Whiteboard" },
    { to: "/docs", label: "Docs" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <span className="font-bold text-lg text-gray-800 dark:text-white">
                WorkNest
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">
                Your creative workspace
              </span>
            </div>
          </div>

          {/* Nav Links - desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
                  location.pathname === link.to
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {/* User avatar */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">
                  {user.name}
                </span>
              </div>
            )}

            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
            >
              Logout
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        {menuOpen && (
          <div className="md:hidden mt-3 pb-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm ${
                  location.pathname === link.to
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
