import UserManagement from "@/app/admin/UserManagement";
import { getAllUsers } from "@/app/actions/user";

export default async function AdminPage() {
  const result = await getAllUsers();
  
  // Use the logical OR (||) operator to provide an empty array if result.users is falsy
  const initialUsers = result.success ? (result.users || []) : [];

  return (
    <main className="min-h-screen bg-gray-50">
      <UserManagement initialData={initialUsers} />
    </main>
  );
}