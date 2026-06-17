// pages/Dashboard.jsx - Side-by-side layout (Form on left, Tasks on right)
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

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    filterTodos();
  }, [todos, activeFilter]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todoAPI.getAll();
      setTodos(response.data.todos);
      setError("");
    } catch (err) {
      setError("Failed to load todos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterTodos = () => {
    if (activeFilter === "completed") {
      setFilteredTodos(todos.filter((todo) => todo.completed === true));
    } else if (activeFilter === "pending") {
      setFilteredTodos(todos.filter((todo) => todo.completed === false));
    } else {
      setFilteredTodos(todos);
    }
  };

  const addTodo = async (todoData) => {
    try {
      const response = await todoAPI.create(todoData);
      setTodos([response.data.todo, ...todos]);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to create todo",
      };
    }
  };

  const updateTodo = async (id, todoData) => {
    try {
      const response = await todoAPI.update(id, todoData);
      setTodos(
        todos.map((todo) => (todo._id === id ? response.data.todo : todo)),
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update todo",
      };
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoAPI.delete(id);
      setTodos(todos.filter((todo) => todo._id !== id));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete todo",
      };
    }
  };

  const toggleTodo = async (id) => {
    try {
      const response = await todoAPI.toggle(id);
      setTodos(
        todos.map((todo) => (todo._id === id ? response.data.todo : todo)),
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to toggle todo",
      };
    }
  };

  const completedCount = todos.filter((t) => t.completed === true).length;
  const pendingCount = todos.filter((t) => t.completed === false).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome back, {user?.name}!
            </h1>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Tasks</div>
              <div className="text-3xl font-bold text-indigo-600">
                {totalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-5 py-2 rounded-md font-medium transition ${
              activeFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Tasks ({totalCount})
          </button>

          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-5 py-2 rounded-md font-medium transition ${
              activeFilter === "completed"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Completed ({completedCount})
          </button>

          <button
            onClick={() => setActiveFilter("pending")}
            className={`px-5 py-2 rounded-md font-medium transition ${
              activeFilter === "pending"
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>

        {/* SIDE-BY-SIDE LAYOUT: Form on left, Task List on right */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT COLUMN: Add New Task Form */}
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Add New Task
              </h2>
              <TodoForm onSubmit={addTodo} />
            </div>
          </div>

          {/* RIGHT COLUMN: Task List */}
          <div className="md:w-2/3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-500">Loading your tasks...</div>
              </div>
            ) : (
              <TodoList
                todos={filteredTodos}
                onUpdate={updateTodo}
                onDelete={deleteTodo}
                onToggle={toggleTodo}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
