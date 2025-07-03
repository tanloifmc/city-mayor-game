import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GameBoard from "@/components/game/GameBoard";
import PlayerStats from "@/components/game/PlayerStats";
import Marketplace from "@/components/game/Marketplace";

export default async function Home() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  // Check if user exists in our users table, if not create them
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (userError && userError.code === "PGRST116") {
    // User doesn't exist, create them
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email?.split("@")[0] || "player",
          gold: 1000,
          land_size_x: 10,
          land_size_y: 10,
        },
      ]);

    if (insertError) {
      console.error("Error creating user:", insertError);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Player Stats */}
        <div className="lg:col-span-1">
          <PlayerStats userId={data.user.id} />
        </div>

        {/* Game Board */}
        <div className="lg:col-span-2">
          <GameBoard userId={data.user.id} />
        </div>

        {/* Marketplace */}
        <div className="lg:col-span-1">
          <Marketplace userId={data.user.id} />
        </div>
      </div>
    </div>
  );
}

