// components/TodoItem.jsx
import React, { useState } from "react";

const TodoItem = ({ todo, onUpdate, onDelete, onToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(
    todo.description || "",
  );
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(todo._id);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setLoading(true);
      await onDelete(todo._id);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) return;

    setLoading(true);
    await onUpdate(todo._id, {
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
    setLoading(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Title"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Description"
          rows="2"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-300 text-gray-700 px-4 py-1 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 transition-all ${todo.completed ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            disabled={loading}
            className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <div className="flex-1">
            <h3
              className={`font-semibold ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}
            >
              {todo.title}
            </h3>
            {todo.description && (
              <p
                className={`text-sm mt-1 ${todo.completed ? "text-gray-400" : "text-gray-500"}`}
              >
                {todo.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(todo.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 hover:text-red-600 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
