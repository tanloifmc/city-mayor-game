import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BuildingManager from "@/components/admin/BuildingManager";

export default async function AdminPage() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  // For now, we'll allow any logged-in user to access admin
  // In production, you'd check for admin role here

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel - City Mayor Game</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Building Management</h2>
          <BuildingManager />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            User management features will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}

