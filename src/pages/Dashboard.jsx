// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { todoAPI } from "../services/api";
import Navbar from "../components/Navbar";
import TodoForm from "../components/TodoForm";
import TodoList from "../components/TodoList";

const Dashboard = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchTodos(); }, []);
  useEffect(() => { filterTodos(); }, [todos, activeFilter]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todoAPI.getAll();
      setTodos(response.data.todos);
      setError("");
    } catch (err) {
      setError("Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const filterTodos = () => {
    if (activeFilter === "completed") setFilteredTodos(todos.filter((t) => t.completed));
    else if (activeFilter === "pending") setFilteredTodos(todos.filter((t) => !t.completed));
    else setFilteredTodos(todos);
  };

  const addTodo = async (todoData) => {
    try {
      const response = await todoAPI.create(todoData);
      setTodos([response.data.todo, ...todos]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to create todo" };
    }
  };

  const updateTodo = async (id, todoData) => {
    try {
      const response = await todoAPI.update(id, todoData);
      setTodos(todos.map((t) => (t._id === id ? response.data.todo : t)));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to update todo" };
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoAPI.delete(id);
      setTodos(todos.filter((t) => t._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to delete todo" };
    }
  };

  const toggleTodo = async (id) => {
    try {
      const response = await todoAPI.toggle(id);
      setTodos(todos.map((t) => (t._id === id ? response.data.todo : t)));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to toggle todo" };
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.filter((t) => !t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's on your plate today.</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Tasks</div>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalCount}</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{completedCount} completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{pendingCount} pending</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {[
            { key: "all", label: `All (${totalCount})`, active: "bg-indigo-600 text-white" },
            { key: "completed", label: `Completed (${completedCount})`, active: "bg-green-600 text-white" },
            { key: "pending", label: `Pending (${pendingCount})`, active: "bg-orange-500 text-white" },
          ].map(({ key, label, active }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-5 py-2 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeFilter === key
                  ? active
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Add New Task</h2>
              <TodoForm onSubmit={addTodo} />
            </div>
          </div>

          <div className="md:w-2/3">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}
            {loading ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                Loading your tasks...
              </div>
            ) : (
              <TodoList todos={filteredTodos} onUpdate={updateTodo} onDelete={deleteTodo} onToggle={toggleTodo} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
