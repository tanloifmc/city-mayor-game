import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AuthButton() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return data.user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">Hey, {data.user.email}!</span>
      <Link
        href="/admin"
        className="py-2 px-3 rounded-md no-underline bg-green-600 hover:bg-green-700 text-white text-sm"
      >
        Admin
      </Link>
      <form action={signOut}>
        <button className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover text-white text-sm">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <Link
      href="/login"
      className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover text-white"
    >
      Login
    </Link>
  );
}


