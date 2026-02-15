// src/app/admin/users/_lib/useUsers.ts
import { useState, useEffect } from "react";
import { getAllUsers } from "@/app/actions/user";

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const refreshUsers = async () => {
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users || []);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(u => 
        u.username.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, users]);

  return { filteredUsers, searchTerm, setSearchTerm, refreshUsers };
}