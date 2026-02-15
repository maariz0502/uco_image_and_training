"use client";

import { useState, useEffect } from "react";
import { createNewUser, getAllUsers, deleteUser, updateUser } from "@/app/actions/user";
import MultiSelectDropdown, { DropdownOption } from "@/components/ui/MultiSelectDropdown";
import { UserRole } from "@/app/types";

interface UserManagementProps {
  initialData: any[];
}

export default function UserManagement({ initialData }: UserManagementProps) {
  // Data State
  const [users, setUsers] = useState<any[]>(initialData);
  const [filteredUsers, setFilteredUsers] = useState<any[]>(initialData);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if we are editing
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Track WHO we are editing

  // Form States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoleValues, setSelectedRoleValues] = useState<UserRole[]>([UserRole.guest]);

  // --- Helpers ---

  const refreshUsers = async () => {
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users || []);
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setSelectedRoleValues([UserRole.guest]);
    setIsEditing(false);
    setCurrentUserId(null);
    setIsModalOpen(false);
  };

  // Filter users
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const results = users.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  // --- Handlers ---

  // 1. Trigger Edit Mode
  const handleEditClick = (user: any) => {
    setIsEditing(true);
    setCurrentUserId(user.id);
    setUsername(user.username);
    setEmail(user.email);
    setSelectedRoleValues(user.roles as UserRole[]); // Cast to ensure type safety
    setIsModalOpen(true);
  };

  // 2. Handle Submit (Create OR Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // DUPLICATE CHECK: Check if username exists
    const usernameTaken = users.some(
      (u) => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.id !== currentUserId // Ignore self if editing
    );

    if (usernameTaken) {
      alert("This username is already taken. Please choose another.");
      return;
    }

    let result;

    if (isEditing && currentUserId) {
      // Update Mode
      result = await updateUser(currentUserId, username, email, selectedRoleValues);
    } else {
      // Create Mode
      result = await createNewUser(username, email, selectedRoleValues);
    }

    if (result.success) {
      resetForm();
      refreshUsers();
    } else {
      alert(result.error || "Operation failed");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const result = await deleteUser(userId);
    if (result.success) {
      refreshUsers();
    } else {
      alert("Error deleting user");
    }
  };

  const roleOptions: DropdownOption[] = Object.values(UserRole).map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: role,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
          <p className="text-gray-500">Manage users and their roles here.</p>
        </div>
        <button
          onClick={() => {
            resetForm(); // Ensure clean state for new user
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by username or email..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {u.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((r: string) => (
                        <span key={r} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-800">
                {isEditing ? "Edit User" : "Create New User"}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="w-full border text-black border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="jdoe"
                  pattern="\S+"
                  title="Spaces are not allowed"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full border text-black border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <MultiSelectDropdown
                label="Assign Roles"
                options={roleOptions}
                selectedValues={selectedRoleValues}
                onChange={(val) => setSelectedRoleValues(val as UserRole[])}
                placeholder="Select roles..."
              />

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                >
                  {isEditing ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}